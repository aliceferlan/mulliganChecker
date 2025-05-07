// colorSelector.tsx
import { useState, useEffect } from "react";

export default function Colors({
	onChange,
}: {
	onChange?: (colors: Record<string, boolean>) => void;
}) {
	const colorList = {
		white: "https://svgs.scryfall.io/card-symbols/W.svg",
		blue: "https://svgs.scryfall.io/card-symbols/U.svg",
		black: "https://svgs.scryfall.io/card-symbols/B.svg",
		red: "https://svgs.scryfall.io/card-symbols/R.svg",
		green: "https://svgs.scryfall.io/card-symbols/G.svg",
		colorless: "https://svgs.scryfall.io/card-symbols/C.svg",
	};

	const [selectedColors, setSelectedColors] = useState<
		Record<string, boolean>
	>({
		red: false,
		green: false,
		blue: false,
		black: false,
		white: false,
		colorless: false,
	});

	const toggleColor = (colorName: string) => {
		setSelectedColors((prev) => {
			const updated = {
				...prev,
				[colorName]: !prev[colorName],
			};
			if (onChange) onChange(updated);
			return updated;
		});
	};

	useEffect(() => {
		if (onChange) onChange(selectedColors);
	}, []);

	return (
		<div className="colors-container flex">
			{Object.entries(colorList).map(([colorName, imageUrl]) => (
				<div
					key={colorName}
					className={`color-circle ${
						selectedColors[colorName] ? "active" : ""
					}`}
					onClick={() => toggleColor(colorName)}
					style={{
						width: "30px",
						height: "30px",
						borderRadius: "50%",
						margin: "0 5px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						border: "1px solid #999",
						position: "relative",
						overflow: "hidden",
					}}
				>
					<img
						src={imageUrl}
						alt={colorName}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
					/>
					{!selectedColors[colorName] && (
						<div
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: "rgba(128, 128, 128, 0.7)",
							}}
						/>
					)}
				</div>
			))}
		</div>
	);
}
