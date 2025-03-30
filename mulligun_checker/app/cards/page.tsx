// app/cards/search/page.tsx
"use client";

import { useState } from "react";
import { Card } from "@/app/types";

export default function SearchPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [cards, setCards] = useState<Card[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!searchQuery.trim()) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/cards/search?q=${encodeURIComponent(searchQuery)}`
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to search cards");
			}

			const data = await response.json();
			setCards(data.cards);

			if (data.cards.length === 0) {
				setError("No cards found matching your search");
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unknown error occurred"
			);
			console.error("Search error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">Search MTG Cards</h1>

			<form onSubmit={handleSearch} className="mb-8">
				<div className="flex gap-2">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Enter card name or keywords..."
						className="flex-1 px-4 py-2 border rounded"
					/>
					<button
						type="submit"
						disabled={loading}
						className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
					>
						{loading ? "Searching..." : "Search"}
					</button>
				</div>
			</form>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{cards.map((card) => (
					<div
						key={card.id}
						className="border rounded-lg overflow-hidden shadow-md"
					>
						{card.front.imageUrl ? (
							<img
								src={card.front.imageUrl}
								alt={card.name}
								className="w-full h-auto object-cover"
							/>
						) : (
							<div className="bg-gray-200 h-56 flex items-center justify-center">
								<span className="text-gray-500">
									No image available
								</span>
							</div>
						)}
						{card.back?.imageUrl ? (
							<img
								src={card.back.imageUrl}
								alt={card.name}
								className="w-full h-auto object-cover"
							/>
						) : null}
						<div className="p-4">
							<h2 className="text-xl font-semibold">
								{card.name}
							</h2>
							<p className="text-gray-600 text-sm">
								{card.front.type}
							</p>
							{card.front.manaCost && (
								<p className="text-blue-600">
									{card.front.manaCost}
								</p>
							)}
							{card.front.text && (
								<p className="mt-2 text-sm">
									{card.front.text}
								</p>
							)}
							{card.front.power && card.front.toughness && (
								<p className="mt-2 text-right font-bold">
									{card.front.power}/{card.front.toughness}
								</p>
							)}
							{card.back?.text && (
								<p className="mt-2 text-sm">{card.back.text}</p>
							)}
							{card.back &&
								card.back.power &&
								card.back.toughness && (
									<p className="mt-2 text-right font-bold">
										{card.back.power}/{card.back.toughness}
									</p>
								)}
						</div>
					</div>
				))}
			</div>

			{cards.length > 0 && (
				<p className="mt-4 text-gray-600">
					Found {cards.length} cards matching your search
				</p>
			)}
		</div>
	);
}
