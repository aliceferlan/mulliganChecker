import { exit } from 'process';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardList, CardNameList } from '@/app/types';

function textProcessor(listData: string): CardNameList {
    let lines = listData.split('\n');
    const processedCardList: CardNameList = {
        mainboard: [],
        sideboard: [],
        maybeboard: [],
    };

    // サイドボードの検出フラグ
    let isSideboard = false;
    // メイビーの検出フラグ
    let isMaybeboard = false;

    let mainboardCount = 0;
    let sideboardCount = 0;
    let maybeboardCount = 0;
    let processedCount = 0;

    lines.filter(line => {
        // サイドボードの開始行を検出
        if (/^サイド.*|^side.*/i.test(line) && !/^\d+/.test(line)) {
            console.log("sideboard detected :" + line)
            isSideboard = true;
            return false; // この行自体をスキップ
        }

        // maybe ボードの開始行を検出
        if (/^メイビー.*|^maybe .*/i.test(line) && !/^\d+/.test(line)) {
            isMaybeboard = true;
            return false; // この行自体をスキップ
        }

        // 空行をスキップ
        if (!line.trim()) return false;
        // 数字+スペースで始まらない行はスキップ
        if (!/^\d+/.test(line)) {
            return false;
        }

        maybeboardCount++;
        if (!isMaybeboard) {
            sideboardCount++;
        }
        if (!isSideboard && !isMaybeboard) {
            mainboardCount++;
        }
        return true;
    })
        .map(line => {
            // 全角かっことその中身を削除
            line = line.replace(/（.*?）/g, '');

            // A-のマークを削除
            line = line.replace(/A-/, '');

            // セット表記と数字を削除 (M21) 241 や (BRO) 199 のような部分
            line = line.replace(/\s+\([A-Z0-9]+\)\s+[0-9]+$/, '');

            // 先頭の数字と名前を分離
            const name = line.replace(/^\d+\s+/, '');
            const amount = line.match(/^\d+/)?.[0] || '1'; // 数字が見つからなければ 1 をデフォルトにする

            if (processedCount < mainboardCount) {
                // メインボードの場合
                processedCardList.mainboard.push({
                    name: name,
                    amount: parseInt(amount),
                });
            } else if (processedCount < sideboardCount) {
                // サイドボードの場合
                processedCardList.sideboard.push({
                    name: name,
                    amount: parseInt(amount),
                });
            } else if (processedCount < maybeboardCount) {
                // メイビーの場合
                processedCardList.maybeboard.push({
                    name: name,
                    amount: parseInt(amount),
                });
            }
            processedCount++;
        });
    return processedCardList;
}


export function useCardList() {
    // カードリストの状態
    const [cardList, setCardList] = useState<CardList>({
        mainboard: [],
        sideboard: [],
        maybeboard: [],
    });
    // テキストエリアの入力値
    const [inputText, setInputText] = useState<string>('');

    useEffect(() => {
        console.log('inputText changed:', inputText);
    }, [inputText]);

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

            console.log("Processed text:", processedText);

            // APIリクエスト
            const response = await fetch('/api/cards/deck', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processedText),
            });

            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }

            const data = await response.json();

            console.log("API response:", data);

            // 受け取ったデータの後処理
            const processedCards: CardList = data
            console.log("Processed cards:", processedCards);
            // 型変換: Card[] から { name: string; amount: number; }[] への変換
            setCardList({
                mainboard: processedCards.mainboard.map(card => ({
                    id: card.id,
                    name: card.name,
                    amount: card.amount || 1,
                    front: card.front,
                    back: card.back,
                    set: card.set,
                })),
                sideboard: processedCards.sideboard.map(card => ({
                    id: card.id,
                    name: card.name,
                    amount: card.amount || 1,  // amountがundefinedの場合は1を設定
                    front: card.front,
                    back: card.back,
                    set: card.set,
                })),
                maybeboard: processedCards.maybeboard.map(card => ({
                    id: card.id,
                    name: card.name,
                    amount: card.amount || 1,  // amountがundefinedの場合は1を設定
                    front: card.front,
                    back: card.back,
                    set: card.set,
                }))
            });
            console.log("Card list updated:", cardList);
            // 成功したら入力をクリア（オプション）
            // setInputText('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
            console.error('カード処理エラー:', err);
        } finally {
            setIsLoading(false);
        }
    }, [inputText]);

    // カードの削除機能
    const removeCard = useCallback((cardName: string) => {
        setCardList(prevCards => ({
            mainboard: prevCards.mainboard.filter(card => card.name !== cardName),
            sideboard: prevCards.sideboard.filter(card => card.name !== cardName),
            maybeboard: prevCards.maybeboard.filter(card => card.name !== cardName),
        }));
    }, []);

    // カードリストのクリア
    const clearCardList = useCallback(() => {
        setCardList({
            mainboard: [],
            sideboard: [],
            maybeboard: [],
        });
        setInputText('');
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
