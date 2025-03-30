// lib/mtgApi.ts
import axios from 'axios';
import { Card, CardData } from '@/app/types';

// Scryfall API のベース URL
const SCRYFALL_API_BASE = 'https://api.scryfall.com';

// Scryfall API からのレスポンスを Card 型に変換する関数
function mapScryfallCardToCard(scryfallCard: any): Card {
    // 基本的なカードデータを作成
    const card: Card = {
        id: scryfallCard.id,
        name: scryfallCard.name,
        rarity: scryfallCard.rarity,
        set: scryfallCard.set,
        flavor: scryfallCard.flavor_text,
        artist: scryfallCard.artist,
        front: {
            manaCost: scryfallCard.mana_cost,
            cmc: scryfallCard.cmc,
            colors: scryfallCard.colors,
            colorIdentity: scryfallCard.color_identity,
            type: scryfallCard.type_line,
            text: scryfallCard.oracle_text,
            power: scryfallCard.power,
            toughness: scryfallCard.toughness,
            imageUrl: scryfallCard.image_uris?.normal || scryfallCard.image_uris?.png,
        }
    };

    // 両面カードの場合（card_facesプロパティがある場合）
    if (scryfallCard.card_faces && scryfallCard.card_faces.length > 1) {
        // 表面のデータを更新
        const frontFace = scryfallCard.card_faces[0];
        card.front = {
            manaCost: frontFace.mana_cost,
            cmc: frontFace.cmc || scryfallCard.cmc, // 一部のカードは個別のcmcを持たない
            colors: frontFace.colors || scryfallCard.colors,
            colorIdentity: scryfallCard.color_identity, // color_identityはカード全体の属性
            type: frontFace.type_line,
            text: frontFace.oracle_text,
            power: frontFace.power,
            toughness: frontFace.toughness,
            imageUrl: frontFace.image_uris?.normal || frontFace.image_uris?.png || scryfallCard.image_uris?.normal,
        };

        // 裏面のデータを設定
        const backFace = scryfallCard.card_faces[1];
        card.back = {
            manaCost: backFace.mana_cost,
            cmc: backFace.cmc || scryfallCard.cmc,
            colors: backFace.colors || scryfallCard.colors,
            colorIdentity: scryfallCard.color_identity,
            type: backFace.type_line,
            text: backFace.oracle_text,
            power: backFace.power,
            toughness: backFace.toughness,
            imageUrl: backFace.image_uris?.normal || backFace.image_uris?.png,
        };
    }

    return card;
}

// カード名で検索する関数
export async function searchCardByName(name: string): Promise<Card | null> {
    try {
        const response = await axios.get(`${SCRYFALL_API_BASE}/cards/named`, {
            params: { exact: name },
        });

        if (response.data && response.data.object === 'card') {
            // カードが見つかった場合、データを変換して返す
            return mapScryfallCardToCard(response.data);
        }

        // const response2 = await axios.get(`${SCRYFALL_API_BASE}/cards/named`, {
        //     params: { fuzzy: name },
        // });
        // return mapScryfallCardToCard(response2.data);

        return null; // カードが見つからなかった場合
    } catch (error) {
        // 404 エラーの場合はカードが見つからなかったことを示す
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }

        // その他のエラーは再スロー
        console.error('Error searching card from Scryfall:', error);
        throw error;
    }
}

// あいまい検索でカードを検索する関数
export async function searchCardsFuzzy(query: string, limit: number = 20): Promise<Card[]> {
    try {
        const response = await axios.get(`${SCRYFALL_API_BASE}/cards/search`, {
            params: {
                q: query,
                page: 1,
                order: 'name',
            },
        });

        // 結果をマッピングして返す
        const cards = response.data.data.slice(0, limit).map(mapScryfallCardToCard);
        return cards;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return [];
        }

        console.error('Error searching cards from Scryfall:', error);
        throw error;
    }
}

// その他の関数も同様に更新...

