// サーチするコンソールのコンポーネント
// 名前

import Colors from "./colorSelector";
import CMCSelector from "./cmcSelector";
import FormatSelector from "./formatSelector";
import TextSelector from "./textSelector";
import ManaSelector from "./manaSelector";
import OracleSelector from "./oracleSelector";
import TypeSelector from "./typeSelector";
import { Type, ManaSelection } from "@/app/types";
import { useState, FormEvent, useRef, useCallback, useMemo } from "react"; // useCallback, useMemo をインポート

function search() {
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

function getTypesList() {
	// タイプリストを取得する処理をここに書く
	// 例: APIからタイプリストを取得する
	return ["Creature", "Instant", "Sorcery", "Artifact", "Enchantment"];
}

// 文字列配列をType型の配列に変換する関数
function convertStringsToTypes(strings: string[]): Type[] {
	return strings.map((name, index) => ({
		status: index.toString(), // インデックスをstatusとして使用
		name,
	}));
}

export default function SearchConsole() {
	const setsList = useMemo(() => convertStringsToTypes(getSetsList()), []);
	const typeList = useMemo(() => convertStringsToTypes(getTypesList()), []);

	const [searchParams, setSearchParams] = useState<{
		name: string;
		set: string;
		rarity: string;
		sort: string;
		language: string;
		cmc: any[]; // 後で正しい型にしてOK
		manaSymbols: ManaSelection;
		colors: { selection: string; symbols: string[] }; // 例: { selection: "", ["W", "U"] }
		formats: any[]; // 同上
		types: string;
		oracle: string;
	}>({
		name: "",
		set: "",
		rarity: "all",
		sort: "asc",
		language: "en",
		cmc: [],
		manaSymbols: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
		colors: { selection: "", symbols: [] },
		formats: [],
		types: "",
		oracle: "",
	});
	const handleSearch = () => {
		console.log("Search Conditions:", searchParams);
		// fetch などで API に投げてもよい
	};

	const handleManaChange = useCallback((manaSymbols: ManaSelection) => {
		setSearchParams((prev) => ({ ...prev, manaSymbols }));
	}, []); // setSearchParams is stable, so [] is fine

	const handleColorChange = useCallback(
		(colors: { selection: string; symbols: string[] }) => {
			setSearchParams((prev) => ({ ...prev, colors }));
		},
		[]
	);

	const handleFormatChange = useCallback((formats: string[]) => {
		setSearchParams((prev) => ({ ...prev, formats }));
	}, []);

	const handleCmcChange = useCallback((cmcSelections: any[]) => {
		// Consider using a more specific type for cmcSelections
		setSearchParams((prev) => ({ ...prev, cmc: cmcSelections }));
	}, []);

	const handleTypesChange = useCallback((queryString: string) => {
		setSearchParams((prev) => ({ ...prev, types: queryString }));
	}, []);

	const handleOracleTextChange = useCallback((oracleQuery: string) => {
		// Renamed to avoid conflict if another oracle related handler exists
		setSearchParams((prev) => ({ ...prev, oracle: oracleQuery }));
	}, []);

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
				<FormatSelector onChange={handleFormatChange} />

				{/* ネームセレクタ */}
				<div className="search-console__input">
					<input type="text" placeholder="Name..." />
				</div>

				{/* カラーセレクタ */}
				<div>
					<ManaSelector
						onChange={handleManaChange} // メモ化された関数を使用
					/>
				</div>
				<div>
					{/* オラクルセレクタ */}
					<TextSelector id="oracle" />
				</div>
				<div>{/* power/tough/loyarity selector */}</div>
				<div>
					<CMCSelector onChange={handleCmcChange} />
				</div>

				{/* タイプセレクタ */}
				<TypeSelector onChange={handleTypesChange} />

				{/* オラクルテキストセレクタ */}
				<OracleSelector onChange={handleOracleTextChange} />

				{/* レイアウトセレクタ */}
				<div className="search-console__button">
					<button onClick={handleSearch}>Search</button>
				</div>

				{/* セットセレクタ */}

				<div className="search-console__input">
					<input type="text" placeholder="Set..." />
				</div>
				<TypeSelector typeList={setsList} />

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
