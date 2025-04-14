// lib/cardService.ts
import { SearchQuery, Card } from '@/app/types';


// カードを検索する
export async function searchCards(query: SearchQuery): Promise<Card[] | null> {

    // 中身が空の場合は null を返す
    if (Object.keys(query).length === 0) {
        console.log(`No query provided`);
        return null;
    }

    // DB から検索
    const cardFromDb = await fetch('/api/card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
    }).then((res) => res.json());

    // DB に存在する場合はそれを返す
    if (cardFromDb) {
        console.log(`Card found in database`);
        return cardFromDb;
    }

    //  見つからない場合は null を返す
    console.log(`Card not found in API`);
    return null;
}
