import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardList } from "@/app/types";

// カードタイプの分類関数
const categorizeCardType = (type: string) => {
	const lowerType = type.toLowerCase();
	if (lowerType.includes("creature")) return "creature";
	if (lowerType.includes("planeswalker")) return "planeswalker";
	if (lowerType.includes("instant") || lowerType.includes("sorcery"))
		return "spell";
	if (
		lowerType.includes("enchantment") ||
		lowerType.includes("artifact") ||
		lowerType.includes("battle")
	)
		return "noncreature";
	if (lowerType.includes("land")) return "land";
	return "other";
};

// カードコンポーネント
const CardComponent = (card: Card) => {
	// カードの面の表示情報を取得
	const [isFlipped, setIsFlipped] = useState(false);
	const hasBackSide = !!card.back?.imageUrl;

	// 拡大表示の状態
	const [isEnlarged, setIsEnlarged] = useState(false);

	// 長押し関連の状態
	const [isLongPress, setIsLongPress] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const longPressTime = 250; // 長押し判定の時間（ミリ秒）

	// タッチ/マウスダウン時の処理
	const handlePressStart = useCallback(
		(
			e:
				| React.MouseEvent<HTMLDivElement>
				| React.TouchEvent<HTMLDivElement>
		) => {
			// 長押しタイマーをセット
			timerRef.current = setTimeout(() => {
				// 長押し時は拡大表示を切り替え
				setIsEnlarged(true);
				// イベントのデフォルト動作を防止（コンテキストメニュー等）
				e.preventDefault();
			}, longPressTime);
		},
		[]
	);

	// タッチ/マウスアップ時の処理
	const handlePressEnd = useCallback(() => {
		// タイマーをクリア
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		// 長押しでなければクリックとして処理
		if (!isLongPress) {
			if (hasBackSide) {
				setIsFlipped(!isFlipped);
			}
		}
		// 長押し状態をリセット
		setIsLongPress(false);
	}, [hasBackSide, isFlipped, isLongPress]);

	// 要素外に移動した場合の処理
	const handlePressCancel = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		setIsLongPress(false);
	}, []);

	// 通常クリック時の処理
	const handleClick = useCallback(() => {
		// 拡大表示中の場合は拡大表示を解除
		if (isEnlarged) {
			setIsEnlarged(false);
		}
		// 通常表示中かつ裏面がある場合は裏返す
		else if (hasBackSide && !isEnlarged) {
			setIsFlipped(!isFlipped);
		}
	}, [hasBackSide, isFlipped, isEnlarged]);

	const zoomCard = () => {
		console.log(card.name); // デバッグ用ログ
		console.log(card.back);
		// カードをズーム表示
	};

	return (
		<>
			<div
				className="relative inline-block m-2"
				style={{ width: "200px", height: "280px" }}
			>
				<div
					className={`relative cursor-pointer ${
						hasBackSide ? "hover:shadow-lg" : ""
					}`}
					style={{ perspective: "1000px" }}
					// マウスイベント
					onMouseDown={handlePressStart}
					onMouseUp={handlePressEnd}
					onMouseLeave={handlePressCancel}
					// タッチイベント
					onTouchStart={handlePressStart}
					onTouchEnd={handlePressEnd}
					onTouchCancel={handlePressCancel}
					key={card.id}
				>
					<AnimatePresence initial={false} mode="wait">
						<motion.div
							key={isFlipped ? "back" : "front"}
							initial={{ rotateY: isFlipped ? -90 : 90 }}
							animate={{ rotateY: 0 }}
							exit={{ rotateY: isFlipped ? -90 : 90 }}
							transition={{ duration: 0.2 }}
							style={{ transformStyle: "preserve-3d" }}
						>
							<Image
								src={
									isFlipped
										? card.back?.imageUrl || ""
										: card.front?.imageUrl || ""
								}
								key={`${card.id}-image`}
								alt={card.name}
								width={200}
								height={280}
								className="rounded-lg"
							/>
						</motion.div>
					</AnimatePresence>
				</div>

				{/* カード枚数表示 */}
				<div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-70 text-white px-2 py-1 rounded-lg text-sm">
					{card.amount}x
				</div>

				{/* 裏面があることを示すインジケーター */}
				{hasBackSide && (
					<div className="absolute top-2 right-2 bg-blue-500 bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
						↺
					</div>
				)}
			</div>

			{/* 拡大表示用のモーダル */}
			<AnimatePresence>
				{isEnlarged && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-zoom-out"
						onClick={handleClick}
					>
						<motion.div
							initial={{ scale: 0.8 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.8 }}
							transition={{ duration: 0.3 }}
							className="relative"
							style={{ maxWidth: "90vw", maxHeight: "90vh" }}
						>
							<Image
								src={
									isFlipped
										? card.back?.imageUrl || ""
										: card.front?.imageUrl || ""
								}
								alt={card.name}
								width={400} // 拡大サイズ
								height={560} // 拡大サイズ
								className="rounded-lg"
								style={{ objectFit: "contain" }}
							/>

							{/* 裏面がある場合は裏返しボタンも表示 */}
							{hasBackSide && (
								<button
									className="absolute bottom-2 right-2 bg-blue-500 bg-opacity-70 text-white p-2 rounded-full"
									onClick={(e) => {
										e.stopPropagation();
										setIsFlipped(!isFlipped);
									}}
								>
									↺
								</button>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};

// カードセクション（メインボード、サイドボード、メイビーボード）
const CardSection = ({
	title,
	cards,
	totalCards,
}: {
	title: string;
	cards: Card[];
	totalCards: number;
}) => {
	// console.log(cards); // デバッグ用ログ
	// カードタイプごとに分類
	const categorizedCards = {
		creature: cards.filter(
			(card) => categorizeCardType(card.front?.type || "") === "creature"
		),
		planeswalker: cards.filter(
			(card) =>
				categorizeCardType(card.front?.type || "") === "planeswalker"
		),
		spell: cards.filter(
			(card) => categorizeCardType(card.front?.type || "") === "spell"
		),
		noncreature: cards.filter(
			(card) =>
				categorizeCardType(card.front?.type || "") === "noncreature"
		),
		land: cards.filter(
			(card) => categorizeCardType(card.front?.type || "") === "land"
		),
		other: cards.filter(
			(card) => categorizeCardType(card.front?.type || "") === "other"
		),
	};

	const categoryTitles = {
		creature: "クリーチャー",
		planeswalker: "プレインズウォーカー",
		spell: "呪文 (インスタント/ソーサリー)",
		noncreature:
			"非クリーチャー・パーマネント (エンチャント/アーティファクト/バトル)",
		land: "ランド",
		other: "その他",
	};

	return (
		<div className="mt-6">
			<h2 className="text-xl font-semibold mb-2">
				{title} ({cards.length}種 {totalCards}枚)
			</h2>

			{cards.length === 0 ? (
				<p className="text-gray-500">カードがありません</p>
			) : (
				(
					Object.keys(
						categorizedCards
					) as (keyof typeof categorizedCards)[]
				).map((category) => {
					const categoryCards = categorizedCards[category];
					if (categoryCards.length === 0) return null;

					return (
						<div key={category} className="mb-6">
							<h3 className="text-lg font-medium mb-2 text-gray-700">
								{categoryTitles[category]} (
								{categoryCards.reduce(
									(acc, card) => acc + (card.amount || 0),
									0
								)}
								枚)
							</h3>
							<div className="flex flex-wrap">
								{categoryCards.map((card) => (
									<CardComponent
										name={card.name}
										front={card.front}
										back={card.back}
										amount={card.amount}
										id={card.id}
									/>
								))}
							</div>
						</div>
					);
				})
			)}
		</div>
	);
};

const DeckList: React.FC<CardList> = ({ mainboard, sideboard, maybeboard }) => {
	const mainboardTotal = mainboard.reduce(
		(acc, card) => acc + (card.amount || 0),
		0
	);
	const sideboardTotal =
		sideboard?.reduce((acc, card) => acc + (card.amount || 0), 0) || 0;
	const maybeboardTotal =
		maybeboard?.reduce((acc, card) => acc + (card.amount || 0), 0) || 0;

	return (
		<div>
			<CardSection
				title="メインデッキ"
				cards={mainboard}
				totalCards={mainboardTotal}
			/>

			{sideboard && sideboard.length > 0 && (
				<CardSection
					title="サイドボード"
					cards={sideboard}
					totalCards={sideboardTotal}
				/>
			)}

			{maybeboard && maybeboard.length > 0 && (
				<CardSection
					title="メイビーボード"
					cards={maybeboard}
					totalCards={maybeboardTotal}
				/>
			)}
		</div>
	);
};
export default DeckList;
