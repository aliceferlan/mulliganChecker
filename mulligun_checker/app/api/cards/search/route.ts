// app/api/cards/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchCards } from '@/app/lib/cardSearch';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const exactName = searchParams.get('name');

    try {
        if (exactName) {
            // 正確な名前で検索
            const card = await searchCards({ name: exactName });

            if (!card) {
                return NextResponse.json({ error: 'Card not found' }, { status: 404 });
            }

            return NextResponse.json({ card });
        } else if (query) {
            // キーワード検索
            const cards = await searchCards({ name: query });

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
