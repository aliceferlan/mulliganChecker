// app/api/cards/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchCardsByKeyword, findCardByName } from '@/app/lib/cardService';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const exactName = searchParams.get('name');

    try {
        if (exactName) {
            // 正確な名前で検索
            const card = await findCardByName(exactName);

            if (!card) {
                return NextResponse.json({ error: 'Card not found' }, { status: 404 });
            }

            return NextResponse.json({ card });
        } else if (query) {
            // キーワード検索
            const cards = await searchCardsByKeyword(query);

            // console.log('Search results:', cards); // デバッグ用ログ
            return NextResponse.json({ cards });
        } else {
            return NextResponse.json({ error: 'Search parameter is required' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error searching cards:', error);
        return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
    }
}
