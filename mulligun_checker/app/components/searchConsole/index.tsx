// サーチするコンソールのコンポーネント
// 名前

import { useState } from "react";

function seach() {
	// 検索用処理をここに書く
	console.log("Searching...");
}

function Colors() {
	const colorList = {
		white: "#ffffff",
		blue: "#0000ff",
		black: "#000000",
		red: "#ff0000",
		green: "#00ff00",
		colorless: "#808080",
	};
	// 選択された色を管理する状態
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

	// const [setSelectedWays, setSetSelectedWays] = useState<Record<string>>({});

	const toggleColor = (colorName: string) => {
		setSelectedColors((prev) => ({
			...prev,
			[colorName]: !prev[colorName],
		}));
	};

	return (
		<div className="colors-container flex">
			{Object.entries(colorList).map(([colorName, colorCode]) => (
				<div
					key={colorName}
					className={`color-circle ${
						selectedColors[colorName] ? "active" : ""
					}`}
					onClick={() => {
						toggleColor(colorName);
						console.log(
							`Selected color: ${colorName}, Status: ${!selectedColors[
								colorName
							]}`
						);
					}}
					style={{
						backgroundColor: selectedColors[colorName]
							? colorCode
							: "#cccccc",
						width: "30px",
						height: "30px",
						borderRadius: "50%",
						margin: "0 5px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						cursor: "pointer",
						transition: "background-color 0.3s",
						border: "1px solid #999",
						color: selectedColors[colorName]
							? colorName === "white"
								? "#000"
								: "#fff"
							: "#666",
					}}
				>
					{colorName.charAt(0).toUpperCase()}
				</div>
			))}
		</div>
	);
}

export default function SearchConsole() {
	return (
		<div>
			{/* 検索用コンソール */}
			<div className="search-console">
				<div className="search-console__input">
					<input type="text" placeholder="Name..." />
				</div>
				<div className="search-console__button">
					<Colors />
				</div>
			</div>
			{/* 検索表示用エリア */}
			<div className="search-console__result">
				{/* 検索結果を表示する場所 */}
				<p>Search results will be displayed here.</p>
				{/* 検索結果を表示する場所 */}
			</div>
		</div>
	);
}
