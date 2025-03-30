// lib/cards.ts
// import redis from './redis';
import { Redis } from '@upstash/redis'

// 環境変数から接続情報を取得
const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
})


export type CardData = {
    manaCost?: string;
    cmc?: number;
    colors?: string[];
    colorIdentity?: string[];
    type?: string;
    text?: string;
    power?: string;
    toughness?: string;
    imageUrl?: string;
};

export type Card = {
    id: string;
    name: string;
    rarity?: string;
    set?: string;
    flavor?: string;
    artist?: string;
    front: CardData;
    back?: CardData; // 第2面がある場合
};

// カードを保存する関数
export async function saveCard(card: Card): Promise<void> {
    // カードをJSON文字列に変換して保存
    const cardJson = JSON.stringify(card);

    // カードIDによるキー
    await redis.set(`card:${card.id}`, cardJson);

    // カード名によるインデックス
    await redis.set(`cardName:${card.name.toLowerCase()}`, card.id);

    // 検索用にカード名をインデックスに追加
    await redis.zadd('cardNameIndex', { score: 0, member: `${card.name.toLowerCase()}:${card.id}` });
}

// IDによるカードの取得
export async function getCardById(id: string): Promise<Card | null> {
    const cardData = await redis.get(`card:${id}`);

    // デバッグログを追加
    console.log(`Raw card data for ID ${id}:`, cardData);

    if (!cardData) return null;

    try {
        // すでにオブジェクトならそのまま返す
        if (typeof cardData === 'object') {
            return cardData as Card;
        }

        // 文字列の場合のみJSON.parseを実行
        return JSON.parse(cardData as string);
    } catch (error) {
        console.error(`Failed to parse card data for ID ${id}:`, error);
        return null;
    }
}

// 名前によるカードの取得
export async function getCardByName(name: string): Promise<Card | null> {
    const cardId = await redis.get(`cardName:${name.toLowerCase()}`);

    if (!cardId) return null;

    return getCardById(cardId as string);
}

// キーワードによるカードの検索
export async function searchCards(keyword: string, limit: number = 20): Promise<Card[]> {
    try {
        const pattern = keyword.toLowerCase();

        // zrangebylexを直接使用
        const cardKeys = await redis.zrange(
            'cardNameIndex',
            0,
            limit - 1
        );

        const cards: Card[] = [];

        for (const key of cardKeys) {
            const parts = (key as string).split(':');
            if (parts.length === 2) {
                const cardId = parts[1];
                const card = await getCardById(cardId);
                if (card) {
                    cards.push(card);
                }
            }
        }

        return cards;
    } catch (error) {
        console.error('Error in searchCards using zrangebylex:', error);

        // フォールバックメソッドを使用
        return fallbackSearchCards(keyword, limit);
    }
}

// フォールバック検索メソッド
async function fallbackSearchCards(keyword: string, limit: number = 20): Promise<Card[]> {
    try {
        // パターンマッチングを使用
        const pattern = `cardName:${keyword.toLowerCase()}*`;
        const cardNameKeys = await redis.keys(pattern);

        const cards: Card[] = [];
        let count = 0;

        for (const key of cardNameKeys) {
            if (count >= limit) break;

            const cardId = await redis.get(key);
            if (cardId) {
                const card = await getCardById(cardId as string);
                if (card) {
                    cards.push(card);
                    count++;
                }
            }
        }

        return cards;
    } catch (error) {
        console.error('Error in fallbackSearchCards:', error);
        return [];
    }
}


// 複数のカードを一括でインポート
export async function bulkImportCards(cards: Card[]): Promise<void> {
    // パイプラインを使用して一括処理
    const pipeline = redis.pipeline();

    for (const card of cards) {
        const cardJson = JSON.stringify(card);
        pipeline.set(`card:${card.id}`, cardJson);
        pipeline.set(`cardName:${card.name.toLowerCase()}`, card.id);
        pipeline.zadd('cardNameIndex', { score: 0, member: `${card.name.toLowerCase()}:${card.id}` });
    }

    await pipeline.exec();
    console.log(`Imported ${cards.length} cards to Redis`);
}

// 複数カードの取得（ページネーション対応）
export async function getCards(page: number = 1, limit: number = 20): Promise<Card[]> {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // カードIDのリストを取得
    const cardIds = await redis.smembers('allCards') as string[];
    const paginatedIds = cardIds.slice(start, end + 1);

    // 各カードの詳細を取得
    const cards: Card[] = [];
    for (const id of paginatedIds) {
        const card = await getCardById(id);
        if (card) cards.push(card);
    }

    return cards;
}

