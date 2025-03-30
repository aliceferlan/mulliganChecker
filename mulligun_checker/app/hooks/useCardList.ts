import { useState, useEffect, useCallback } from 'react';

// カードの型定義
interface Card {
    id: string;
    name: string;
    // 他の必要なプロパティ
}

function textProcessor(listData: string): string {


    return ""
}

export function useCardList() {
    // カードリストの状態
    const [cardList, setCardList] = useState<Card[]>([]);
    // テキストエリアの入力値
    const [inputText, setInputText] = useState<string>('');
    // ローディング状態
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // エラー状態
    const [error, setError] = useState<string | null>(null);

    // テキストエリアの変更ハンドラ
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
    };

    // 入力テキストの処理とAPI呼び出し
    const processInput = useCallback(async () => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // 入力テキストの前処理（必要に応じて）
            const processedText = textProcessor(inputText)

            // APIリクエスト
            const response = await fetch('/api/cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: processedText }),
            });

            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }

            const data = await response.json();

            // 受け取ったデータの後処理
            const processedCards: Card[] = data.cards.map((card: any) => ({
                id: card.id,
                name: card.name,
                // 他の必要なプロパティのマッピング
            }));

            // カードリストの更新
            setCardList(prevCards => [...prevCards, ...processedCards]);

            // 成功したら入力をクリア（オプション）
            setInputText('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
            console.error('カード処理エラー:', err);
        } finally {
            setIsLoading(false);
        }
    }, [inputText]);

    // カードの削除機能
    const removeCard = useCallback((cardId: string) => {
        setCardList(prevCards => prevCards.filter(card => card.id !== cardId));
    }, []);

    // カードリストのクリア
    const clearCardList = useCallback(() => {
        setCardList([]);
    }, []);

    return {
        cardList,
        inputText,
        isLoading,
        error,
        handleInputChange,
        processInput,
        removeCard,
        clearCardList,
    };
}
