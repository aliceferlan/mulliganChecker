// lib/cardService.ts
import { getCardByName, saveCard, searchCards } from './cards';
import { searchCardByName, searchCardsFuzzy } from './mtgAPI';
import { Card } from '@/app/types';

// カードを名前で検索し、見つからなければ API から取得して保存する
export async function findCardByName(name: string): Promise<Card | null> {
    // まず Redis から検索
    const cardFromDb = await getCardByName(name);

    // Redis に存在する場合はそれを返す
    if (cardFromDb) {
        console.log(`Card "${name}" found in database`);
        return cardFromDb;
    }

    console.log(`Card "${name}" not found in database, searching in API...`);

    // Redis に存在しない場合は API から取得
    const cardFromApi = await searchCardByName(name);

    // API でも見つからない場合は null を返す
    if (!cardFromApi) {
        console.log(`Card "${name}" not found in API`);
        return null;
    }

    console.log(`Card "${name}" found in API, saving to database...`);

    // 取得したカードを Redis に保存
    await saveCard(cardFromApi);

    return cardFromApi;
}

// キーワードでカードを検索し、結果が少なければ API からも取得する
export async function searchCardsByKeyword(keyword: string, minResults: number = 1): Promise<Card[]> {
    // まず Redis から検索
    const cardsFromDb = await searchCards(keyword);

    // 十分な結果がある場合はそれを返す
    if (cardsFromDb.length >= minResults) {
        console.log(`Found ${cardsFromDb.length} cards for "${keyword}" in database`);
        return cardsFromDb;
    }

    console.log(`Only ${cardsFromDb.length} cards found for "${keyword}" in database, searching in API...`);

    // Redis の結果が少ない場合は API からも取得
    const cardsFromApi = await searchCardsFuzzy(keyword);

    // 重複を避けるため、既存の ID を記録
    const existingIds = new Set(cardsFromDb.map(card => card.id));

    // API から取得した新しいカードをフィルタリング
    const newCards = cardsFromApi.filter(card => !existingIds.has(card.id));

    console.log(`Found ${newCards.length} new cards from API, saving to database...`);

    // 新しいカードを Redis に保存（非同期で処理）
    for (const card of newCards) {
        saveCard(card).catch(err => {
            console.error(`Error saving card ${card.id}:`, err);
        });
    }

    // 両方の結果を結合して返す
    return [...cardsFromDb, ...newCards];
}
