import { json } from "stream/consumers";
import { CardList, Card } from "@/app/types";
import { searchCardByName } from "@/app/lib/mtgAPI";
import { NextResponse } from 'next/server';

async function getCardListFromRequest(request: Request): Promise<CardList> {
    const decoder = new TextDecoder();
    const stream = request.body;
    const deckList: CardList = stream
        ? JSON.parse(decoder.decode(await new Response(stream).arrayBuffer()))
        : { cards: [] };
    return deckList;
}


async function getCardDataFromBoard(deckList: Card[]): Promise<Card[]> {

    const cardDataList: Card[] = [];

    for (const cardName of deckList) {
        const cardData = await searchCardByName(cardName.name)
        if (cardData) {
            cardDataList.push(cardData);
        }
    }
    return cardDataList;
}

import { findCardByName } from "@/app/lib/cardService";

async function getCardDataFromNameEachBoard(getCardDataFromNameEachBoard: Card[]): Promise<Card[]> {

    const cardDataList: Card[] = [];

    for (const cardName of getCardDataFromNameEachBoard) {
        // console.log(cardName.name); // デバッグ用ログ
        // const cardData = await fetch(`https://api.scryfall.com/cards/named?exact=${cardName.name}`)
        //     .then((res) => res.json())
        //     .then((data) => data);

        const cardData = await findCardByName(cardName.name)
        if (cardData) {

            // console.log(cardData); // デバッグ用ログ
            // console.log("card amount", cardName); // デバッグ用ログ
            cardDataList.push(cardData);
            cardDataList[cardDataList.length - 1].amount = cardName.amount; // カウントを追加
            cardDataList[cardDataList.length - 1].front = cardData.front; // フロントを追加
            cardDataList[cardDataList.length - 1].back = cardData.back; // フロントを追加
        }
    }
    return cardDataList;
}
export async function POST(request: Request) {
    const deckList: CardList = await getCardListFromRequest(request)
    // console.log(deckList); // デッキリストが出力される

    const deckData: CardList = {
        mainboard: [],
        sideboard: [],
        maybeboard: [],
    }

    try {

        // カード名からカードデータを取得する
        // console.log("main deck list :", deckList.mainboard)
        deckData.mainboard = await getCardDataFromNameEachBoard(deckList.mainboard)
        deckData.sideboard = await getCardDataFromNameEachBoard(deckList.sideboard)
        deckData.maybeboard = await getCardDataFromNameEachBoard(deckList.maybeboard)

        // console.log('%o', deckData); // デッキデータが出力される
        return NextResponse.json(deckData);

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json('Internal Server Error', { status: 500 });
    }
    finally {
        console.log('finally')
    }

}