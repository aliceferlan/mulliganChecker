"use client";

import { useState, useEffect } from "react";
import { useCardList } from "@/app/hooks/useCardList";

export default function CardManager() {
	const [card, setCard] = useState(null);
	const [loading, setLoading] = useState(false);

	async function fetchCard(name = "anarchy") {
		setLoading(true);
		try {
			const res = await fetch(`/api/cards/${name}`);
			const data = await res.json();
			setCard(data.card);
			// console.log(data);
		} catch (error) {
			console.error("Error fetching card:", error);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchCard();
	}, []);

	const {
		cardList,
		inputText,
		isLoading,
		error,
		handleInputChange,
		processInput,
		removeCard,
		clearCardList,
	} = useCardList();

	return (
		<div className="p-4">
			<h1 className="text-2xl font-bold mb-4">カード管理</h1>

			{/* 入力エリア */}
			<div className="mb-4">
				<textarea
					className="w-full p-2 border rounded"
					rows={5}
					value={inputText}
					onChange={handleInputChange}
					placeholder="カード情報を入力してください..."
					disabled={isLoading}
				/>
				<div className="mt-2 flex gap-2">
					<button
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
						onClick={processInput}
						disabled={isLoading || !inputText.trim()}
					>
						{isLoading ? "処理中..." : "処理する"}
					</button>
					<button
						className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
						onClick={clearCardList}
						disabled={inputText.length === 0}
					>
						リストをクリア
					</button>
				</div>
			</div>

			{/* エラーメッセージ */}
			{error && (
				<div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
					{error}
				</div>
			)}

			{/* カードリスト */}
			<div className="mt-6">
				<h2 className="text-xl font-semibold mb-2">
					カードリスト ({cardList.mainboard.length}枚)
				</h2>
				{cardList.mainboard.length === 0 ? (
					<p className="text-gray-500">カードがありません</p>
				) : (
					<ul className="space-y-2">
						{cardList.mainboard.map((card) => (
							<li
								key={card.name}
								className="p-3 border rounded flex justify-between items-center"
							>
								<span>{card.name}</span>
								<span>{card.amount}</span>
								<button
									className="text-red-500 hover:text-red-700"
									onClick={() => removeCard(card.name)}
								>
									削除
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
