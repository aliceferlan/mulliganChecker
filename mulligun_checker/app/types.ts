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

export type Type = {
    status: string; // タイプのID
    name: string; // タイプの名前
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
    amount?: number; // カードの枚数
};

export type CardList = {
    mainboard: Card[];
    sideboard: Card[];
    maybeboard: Card[];
};

export type CardNameList = {
    mainboard: {
        name: string;
        amount: number;
    }[];
    sideboard: {
        name: string;
        amount: number;
    }[];
    maybeboard: {
        name: string;
        amount: number;
    }[];
};

export interface ManaSelection {
    W: number;
    U: number;
    B: number;
    R: number;
    G: number;
    C: number;
}

export interface SearchQuery {
    name?: string; // カード名
    set?: string; // セット名
    power?: number; // パワー
    toughness?: number; // タフネス
    loyalty?: number; // ロイヤリティ
    cmc?: number; // マナコスト
    type?: string; // カードタイプ
    color?: string; // カラー
    rarity?: string; // レアリティ
    oracle?: string; // テキスト
    artist?: string; // アーティスト
}
