// app/api/cards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchCards } from '@/app/lib/cardSearch';
import { Card } from '@/app/types';

// カード一覧の取得
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '200');




    try {
        const cards = await searchCards(page, limit);
        return NextResponse.json({ cards });
    } catch (error) {
        console.error('Error fetching cards:', error);
        return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
    }
}