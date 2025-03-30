// app/api/cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCards, saveCard, getCardByName } from '@/app/lib/cards';
import { Card } from '@/app/types';

// カード一覧の取得
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '200');

    try {
        const cards = await getCards(page, limit);
        return NextResponse.json({ cards });
    } catch (error) {
        console.error('Error fetching cards:', error);
        return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
    }
}

// カードの作成
export async function POST(request: NextRequest) {
    try {
        const card = await request.json() as Card;

        // 必須フィールドの検証
        if (!card.id || !card.name) {
            return NextResponse.json({ error: 'Card ID and name are required' }, { status: 400 });
        }

        // 既存のカードをチェック
        const existingCard = await getCardByName(card.name);
        if (existingCard) {
            return NextResponse.json({ error: 'Card with this name already exists' }, { status: 409 });
        }

        await saveCard(card);
        return NextResponse.json({ success: true, card });
    } catch (error) {
        console.error('Error creating card:', error);
        return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
    }
}
