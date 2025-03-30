// app/api/cards/[id]/route.ts
import { NextResponse } from 'next/server';
import { getCardById, saveCard, Card } from '@/app/lib/cards';

// 特定のカードを取得
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const card = await getCardById(params.id);
        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Error fetching card:', error);
        return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
    }
}
