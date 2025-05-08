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

const colorConbination: string[] = ["Commander", "Exactly", "AtLeast"];

const symbolToColorName: Record<keyof ManaSelection, string> = {
	W: "white",
	U: "blue",
	B: "black",
	R: "red",
	G: "green",
	C: "colorless",
};

// Define the new payload structure for onChange
interface ManaSelectorOnChangePayload {
	selectionType: string;
	manaCounts: ManaSelection;
	highlightedSymbols: string[]; // Added to send symbols based on highlight state
}

export default function ManaSelector({
	onChange,
}: {
	onChange?: (payload: ManaSelectorOnChangePayload) => void; // Updated prop type
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

	// Add state for the selection type
	const [selectionType, setSelectionType] = useState<string>("Exactly"); // Default to "Exactly"

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
		if (onChange) {
			// Derive highlighted symbols from the selectedColors state
			const activeHighlightedSymbols = Object.entries(selectedColors)
				.filter(([_, isHighlighted]) => isHighlighted)
				.map(([colorName, _]) => colorNameToSymbol[colorName]);

			const payload: ManaSelectorOnChangePayload = {
				selectionType: selectionType,
				manaCounts: selectedMana,
				highlightedSymbols: activeHighlightedSymbols, // Include in payload
			};
			onChange(payload);
		}
	}, [selectedMana, selectionType, selectedColors, onChange]); // Add selectedColors to dependencies

	const colorOrder: (keyof ManaSelection)[] = ["W", "U", "B", "R", "G", "C"];

	return (
		<div className="p-4 bg-gray-800 rounded-lg shadow-lg text-gray-200">
			{/* Selection Type Dropdown */}
			<div className="mb-6">
				<label
					htmlFor="mana-selection-type"
					className="block text-sm font-semibold text-gray-300 mb-2"
				>
					Mana Selection Mode
				</label>
				<select
					id="mana-selection-type"
					value={selectionType}
					onChange={(e) => setSelectionType(e.target.value)}
					className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
				>
					{colorConbination.map((type) => (
						<option
							key={type}
							value={type}
							className="text-gray-200 bg-gray-700"
						>
							{type}
						</option>
					))}
				</select>
			</div>

			<div className="mb-6">
				<h3 className="text-sm font-semibold text-gray-300 mb-3">
					Mana Symbols:
				</h3>
				<div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center justify-center">
					{colorOrder.map((symbol) => {
						const colorName = symbolToColorName[symbol];
						const isSelected = selectedColors[colorName];
						return (
							<div
								key={symbol}
								className="flex flex-col items-center space-y-2"
							>
								<button
									className={`w-7 h-7 flex items-center justify-center rounded-full text-lg font-semibold transition-colors duration-150 ease-in-out 
                                        ${
											isSelected
												? "bg-green-500 hover:bg-green-600 text-white"
												: "bg-gray-600 hover:bg-gray-500 text-gray-300"
										}`}
									onClick={() => handleManaChange(symbol, 1)}
								>
									+
								</button>
								<div
									className="w-10 h-10 relative cursor-pointer group transition-transform duration-150 ease-in-out hover:scale-110"
									onClick={() => toggleColorBySymbol(symbol)}
								>
									<img
										src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
										alt={colorName}
										className="w-full h-full object-contain"
									/>
									{!isSelected && (
										<div className="absolute inset-0 bg-black opacity-60 rounded-full group-hover:opacity-50 transition-opacity duration-150 ease-in-out" />
									)}
								</div>
								<button
									className={`w-7 h-7 flex items-center justify-center rounded-full text-lg font-semibold transition-colors duration-150 ease-in-out 
                                        ${
											selectedMana[symbol] > 0
												? "bg-red-500 hover:bg-red-600 text-white"
												: "bg-gray-600 hover:bg-gray-500 text-gray-400 cursor-not-allowed"
										}`}
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

			<div>
				<h3 className="text-sm font-semibold text-gray-300 mb-2">
					Selected Mana:
				</h3>
				<div className="flex flex-wrap items-center p-3 bg-gray-700 rounded-md min-h-[40px] shadow-inner">
					{colorOrder.map((symbol) =>
						Array.from(
							{ length: selectedMana[symbol] },
							(_, index) => (
								<img
									key={`${symbol}-${index}`}
									src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
									alt={`${symbolToColorName[symbol]} mana`}
									className="w-6 h-6 mr-1.5 mb-1.5 shadow-sm"
								/>
							)
						)
					)}
					{selectedMana.W === 0 &&
						selectedMana.U === 0 &&
						selectedMana.B === 0 &&
						selectedMana.R === 0 &&
						selectedMana.G === 0 &&
						selectedMana.C === 0 && (
							<span className="text-gray-400 italic text-sm">
								No mana selected
							</span>
						)}
				</div>
			</div>
		</div>
	);
}
