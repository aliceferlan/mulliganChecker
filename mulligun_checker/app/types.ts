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