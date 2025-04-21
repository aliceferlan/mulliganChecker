import { useEffect, useState } from "react";

interface ManaSelection {
	W: number;
	U: number;
	B: number;
	R: number;
	G: number;
	C: number;
}

// 色名とシンボル名のマッピング
const colorNameToSymbol: Record<string, keyof ManaSelection> = {
	white: "W",
	blue: "U",
	black: "B",
	red: "R",
	green: "G",
	colorless: "C",
};

// シンボル名と色名のマッピング
const symbolToColorName: Record<keyof ManaSelection, string> = {
	W: "white",
	U: "blue",
	B: "black",
	R: "red",
	G: "green",
	C: "colorless",
};

export default function ManaSelector() {
	// マナカウントの状態管理
	const [selectedMana, setSelectedMana] = useState<ManaSelection>({
		W: 0,
		U: 0,
		B: 0,
		R: 0,
		G: 0,
		C: 0,
	});

	// 選択された色の状態管理
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

	// マナカウントを増減するハンドラー
	const handleManaChange = (color: keyof ManaSelection, amount: number) => {
		setSelectedMana((prev) => {
			const newValue = Math.max(0, prev[color] + amount);

			// マナが1以上になった場合、その色を選択状態にする
			if (newValue > 0) {
				const colorName = symbolToColorName[color];
				setSelectedColors((prev) => ({
					...prev,
					[colorName]: true,
				}));
			}

			return { ...prev, [color]: newValue };
		});
	};

	// シンボルをタップして色選択を切り替えるハンドラー
	const toggleColorBySymbol = (symbol: keyof ManaSelection) => {
		const colorName = symbolToColorName[symbol];

		setSelectedColors((prev) => {
			const newState = !prev[colorName];

			// 選択が解除される場合は、マナカウントも0にリセット
			if (!newState) {
				setSelectedMana((prevMana) => ({
					...prevMana,
					[symbol]: 0,
				}));
			}

			return {
				...prev,
				[colorName]: newState,
			};
		});
	};

	// 色の順番を定義（WUBRGC順）
	const colorOrder: (keyof ManaSelection)[] = ["W", "U", "B", "R", "G", "C"];

	return (
		<div>
			{/* マナセレクタ コンソール部 */}
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
								{/* 上の+ボタン */}
								<button
									className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center"
									onClick={() => handleManaChange(symbol, 1)}
								>
									+
								</button>

								{/* マナシンボル - クリックで色選択を切り替え */}
								<div
									className={`w-8 h-8 my-1 relative cursor-pointer`}
									onClick={() => toggleColorBySymbol(symbol)}
								>
									<img
										src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`}
										alt={symbolToColorName[symbol]}
										className="w-full h-full"
									/>

									{/* 非選択時のグレーマスク - mix-blend-modeでシンボル形状を保持 */}
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

								{/* 下の-ボタン */}
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

			{/* マナシンボル表示部 */}
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
