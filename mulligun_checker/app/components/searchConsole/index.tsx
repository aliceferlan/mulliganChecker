// サーチするコンソールのコンポーネント
// 名前

import { useState } from "react";
import Colors from "./colorSelector";
import CMCSelector from "./cmcSelector";
import FormatSelector from "./formatSelector";
import TextSelector from "./textSelector";
import ManaSelector from "./manaSelector";
import OracleSelector from "./oracleSelector";
import TypeSelector from "./typeSelector";
import { Type } from "@/app/types";
import { cp } from "fs";

function seach() {
	// 検索用処理をここに書く
	console.log("Searching...");
}

function getSetsList() {
	// セットリストを取得する処理をここに書く
	// 例: APIからセットリストを取得する
	return [
		"Alpha",
		"Beta",
		"Unlimited",
		"Arabian Nights",
		"Legends",
		"The Dark",
		"Fallen Empires",
		"Homelands",
	];
}

function getRarityList() {
	// レアリティリストを取得する処理をここに書く
	// 例: APIからレアリティリストを取得する
	return ["Common", "Uncommon", "Rare", "Mythic Rare", "Special"];
}

function getTypesList() {
	// タイプリストを取得する処理をここに書く
	// 例: APIからタイプリストを取得する
	return ["Creature", "Instant", "Sorcery", "Artifact", "Enchantment"];
}

function getLayoutList() {
	// レイアウトリストを取得する処理をここに書く
	// 例: APIからレイアウトリストを取得する
	return ["Normal", "Double-faced", "Token", "Plane"];
}

// 文字列配列をType型の配列に変換する関数
function convertStringsToTypes(strings: string[]): Type[] {
	return strings.map((name, index) => ({
		status: index.toString(), // インデックスをstatusとして使用
		name,
	}));
}

export default function SearchConsole() {
	const setsList = convertStringsToTypes(getSetsList());
	const typeList = convertStringsToTypes(getTypesList());
	const rarityList = convertStringsToTypes(getRarityList());
	const layoutList = convertStringsToTypes(getLayoutList());

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
				<ManaSelector />

				{/* オラクルセレクタ */}
				<TextSelector id="oracle" />

				{/* power/tough/loyarity selector */}

				{/* CMCセレクタ */}
				<CMCSelector />

				{/* タイプセレクタ */}
				<TypeSelector typeList={typeList} />

				{/* オラクルテキストセレクタ */}
				<OracleSelector />

				{/* レイアウトセレクタ */}
				<TypeSelector typeList={layoutList} />

				{/* セットセレクタ */}
				<TypeSelector typeList={setsList} />

				{/* レアリティセレクタ */}
				<TypeSelector typeList={rarityList} />
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
