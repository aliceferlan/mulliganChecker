import { NextRequest, NextResponse } from 'next/server';
import { findCardByName } from '@/app/lib/cardSearch';

// 特定のカードを取得
export async function GET(request: NextRequest) {
    try {
        // URLからパスパラメータを取得
        const { pathname } = new URL(request.url);
        const name = pathname.split('/').pop(); // IDをパスから取得
        console.log('Card Name:', name); // デバッグ用ログ

        if (!name) {
            return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
        }

        const card = await findCardByName(name);
        if (!card) {
            return NextResponse.json({ error: 'Card not found' }, { status: 404 });
        }

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Error fetching card:', error);
        return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 });
    }
}
