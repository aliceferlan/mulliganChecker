// サーチするコンソールのコンポーネント
// 名前

import { div } from "framer-motion/client";

function seach() {
	// 検索用処理をここに書く
	console.log("Searching...");
}

const colorList = {
	red: "#ff0000",
	green: "#00ff00",
	blue: "#0000ff",
	black: "#000000",
	white: "#ffffff",
};

function Colors() {
	return (
		<div className="colors">
			{Object.entries(colorList).map(([colorName, colorCode]) => (
				<div
					key={colorName}
					className="color-box color-box--hover"
					onClick={() => {
						// 色を選択したときの処理を書く
						console.log(`Selected color: ${colorName}`);
					}}
					style={{ backgroundColor: colorCode }}
				>
					{colorName}
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
