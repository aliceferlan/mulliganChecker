import { useEffect, useState } from "react";
import { ManaSelection } from "@/app/types";

const colorNameToSymbol: Record<string, keyof ManaSelection> = {
	white: "W",
	blue: "U",
	black: "B",
	red: "R",
	green: "G",
	colorless: "C",
};

const symbolToColorName: Record<keyof ManaSelection, string> = {
	W: "white",
	U: "blue",
	B: "black",
	R: "red",
	G: "green",
	C: "colorless",
};

export default function ManaSelector({
	onChange,
}: {
	onChange?: (mana: ManaSelection) => void;
}) {
	const [selectedMana, setSelectedMana] = useState<ManaSelection>({
		W: 0,
		U: 0,
		B: 0,
		R: 0,
		G: 0,
		C: 0,
	});

	const [selectedColors, setSelectedColors] = useState<
		Record<string, boolean>
	>({
		white: false,
		blue: false,
		black: false,
		red: false,
		green: false,
		colorless: false,
	});

	const handleManaChange = (color: keyof ManaSelection, amount: number) => {
		setSelectedMana((prev) => {
			const newValue = Math.max(0, prev[color] + amount);
			if (newValue > 0) {
				const colorName = symbolToColorName[color];
				setSelectedColors((prev) => ({ ...prev, [colorName]: true }));
			}
			return { ...prev, [color]: newValue };
		});
	};

	const toggleColorBySymbol = (symbol: keyof ManaSelection) => {
		const colorName = symbolToColorName[symbol];
		setSelectedColors((prev) => {
			const newState = !prev[colorName];
			if (!newState) {
				setSelectedMana((prevMana) => ({ ...prevMana, [symbol]: 0 }));
			}
			return { ...prev, [colorName]: newState };
		});
	};

	useEffect(() => {
		if (onChange) onChange(selectedMana);
	}, [selectedMana, onChange]);

	const colorOrder: (keyof ManaSelection)[] = ["W", "U", "B", "R", "G", "C"];

	return (
		<div>
			<div className="mb-4">
				<h3 className="text-sm font-medium mb-2">マナシンボル:</h3>
				<div className="flex flex-wrap gap-4">
					{colorOrder.map((symbol) => {
						const colorName = symbolToColorName[symbol];
						const isSelected = selectedColors[colorName];
						return (
							<div
								key={symbol}
								className="flex flex-col items-center"
							>
								<button
									className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
									onClick={() => handleManaChange(symbol, 1)}
								>
									+
								</button>
								<div
									className="w-8 h-8 my-1 relative cursor-pointer"
									onClick={() => toggleColorBySymbol(symbol)}
								>
									<img
										src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
										alt={colorName}
										className="w-full h-full"
									/>
									{!isSelected && (
										<div
											className="absolute inset-0"
											style={{
												backgroundColor:
													"rgba(100, 100, 100, 0.8)",
												mixBlendMode: "multiply",
											}}
										/>
									)}
								</div>
								<button
									className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
									onClick={() => handleManaChange(symbol, -1)}
									disabled={selectedMana[symbol] <= 0}
								>
									-
								</button>
							</div>
						);
					})}
				</div>
			</div>
			<div className="mb-4">
				<h3 className="text-sm font-medium mb-2">選択したマナ:</h3>
				<div className="flex flex-wrap">
					{colorOrder.map((symbol) =>
						Array.from(
							{ length: selectedMana[symbol] },
							(_, index) => (
								<img
									key={`${symbol}-${index}`}
									src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
									alt={`${symbolToColorName[symbol]} mana`}
									className="w-6 h-6 mr-1"
								/>
							)
						)
					)}
				</div>
			</div>
		</div>
	);
}
