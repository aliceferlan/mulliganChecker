// サーチするコンソールのコンポーネント
// 名前

import { useState } from "react";
import Colors from "./colorSelector";
import CMCSelector from "./cmcSelector";
import FormatSelector from "./formatSelector";
import TextSelector from "./textSelector";

function seach() {
	// 検索用処理をここに書く
	console.log("Searching...");
}

export default function SearchConsole() {
	return (
		<div>
			{/* 検索用コンソール */}
			<div className="search-console">
				{/* 言語セレクタ */}
				<div className="search-console__language-selector">
					<select name="languages" id="languages">
						<option value="en">English</option>
						<option value="ja">日本語</option>
					</select>
				</div>
				{/* ソートセレクタ */}
				<div className="search-console__sort-selector">
					<select name="sort" id="sort">
						<option value="asc">Ascending</option>
						<option value="desc">Descending</option>
					</select>
				</div>

				{/* フォーマットセレクタ */}
				<FormatSelector />

				{/* ネームセレクタ */}
				<div className="search-console__input">
					<input type="text" placeholder="Name..." />
				</div>

				{/* カラーセレクタ */}
				<div>
					<textarea
						name="name"
						id="name"
						placeholder="Name..."
					></textarea>
				</div>
				<div>
					{/* oracle selector */}
					<TextSelector id="oracle" />
				</div>
				<div className="search-console__button">
					<Colors />
				</div>
				<div>{/* power/tough/loyarity selector */}</div>
				<div>
					<CMCSelector />
				</div>

				{/* タイプセレクタ */}
				<div></div>

				{/* オラクルテキストセレクタ */}
				<div>
					<input type="text" placeholder="Oracle Text..." />
				</div>

				{/* レイアウトセレクタ */}
				<div className="search-console__button">
					<button onClick={seach}>Search</button>
				</div>

				{/* セットセレクタ */}

				<div className="search-console__input">
					<input type="text" placeholder="Set..." />
				</div>

				{/* レアリティセレクタ */}

				<div className="search-console__input">
					<select name="rearity" id="">
						<option value="all">All</option>
						<option value="c">Common</option>
						<option value="u">Uncommon</option>
						<option value="r">Rare</option>
						<option value="m">Mythic</option>
						<option value="s">Special</option>
					</select>
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
