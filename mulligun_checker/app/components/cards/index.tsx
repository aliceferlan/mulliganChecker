import React, { useState, useEffect } from "react";
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
	const [isFlipped, setIsFlipped] = useState(false);
	const hasBackSide = !!card.back?.imageUrl;

	const handleClick = () => {
		console.log(card.name); // デバッグ用ログ
		console.log(card.back);
		if (hasBackSide) {
			setIsFlipped(!isFlipped);
		}
	};

	return (
		<div className="relative inline-block m-2" style={{ width: "200px" }}>
			<div
				className={`relative cursor-pointer ${
					hasBackSide ? "hover:shadow-lg" : ""
				}`}
				style={{ perspective: "1000px" }}
				onClick={handleClick}
				key={card.id}
			>
				<AnimatePresence initial={false} mode="wait">
					<motion.div
						key={isFlipped ? "back" : "front"}
						initial={{ rotateY: isFlipped ? -90 : 90 }}
						animate={{ rotateY: 0 }}
						exit={{ rotateY: isFlipped ? -90 : 90 }}
						transition={{ duration: 0.4 }}
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
