// サーチするコンソールのコンポーネント
// 名前

import { useState } from "react";
import Colors from "./colorSelector";
import CMCSelector from "./cmcSelector";

function seach() {
	// 検索用処理をここに書く
	console.log("Searching...");
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
				<div>
					<CMCSelector />
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
