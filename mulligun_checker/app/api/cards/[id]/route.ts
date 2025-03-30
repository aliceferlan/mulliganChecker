import { NextRequest, NextResponse } from 'next/server';
import { getCardById, saveCard, Card } from '@/app/lib/cards';

// 特定のカードを取得
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
        }

        const card = await getCardById(id);
        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Error fetching card:', error);
        return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
    }
}
