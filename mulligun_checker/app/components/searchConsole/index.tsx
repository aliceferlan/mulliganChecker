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

// Define the new expected argument type for handleManaChange
interface ManaChangePayload {
	selectionType: string; // e.g., "Exactly", "AtLeast", "Commander"
	manaCounts: ManaSelection;
	highlightedSymbols: string[];
}

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
		colors: { selection: string; symbols: string[] };
		formats: any[];
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
		colors: { selection: "", symbols: [] }, // This will be updated by the new handleManaChange
		formats: [],
		types: "",
		oracle: "",
	});
	// 検索結果リストのstateを追加
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSearch = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("https://migawari.com/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(searchParams),
			});
			if (!response.ok) throw new Error("検索APIエラー");
			const data = await response.json();
			setSearchResults(data.cards || []);
		} catch (e: any) {
			setError(e.message || "検索に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	const handleManaChange = useCallback((payload: ManaChangePayload) => {
		const { selectionType, manaCounts, highlightedSymbols } = payload;

		// Determine active symbols based on highlight status first,
		// then fall back to manaCounts if no symbols are highlighted (or keep as is based on desired logic)
		// For this request, highlightedSymbols take precedence for the `colors.symbols` list.
		const symbolsForColors = highlightedSymbols;

		setSearchParams((prev) => ({
			...prev,
			manaSymbols: manaCounts, // Keep raw counts in manaSymbols
			colors: {
				// Update colors with selection type and active symbols
				selection: selectionType,
				symbols: symbolsForColors, // Use the new list derived from highlighted state
			},
		}));
	}, []); // setSearchParams is stable

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
				<div className="search-console__color-selector w-100">
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
				{loading && <p>Loading...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}
				{!loading && !error && searchResults.length === 0 && (
					<p>Search results will be displayed here.</p>
				)}
				{searchResults.length > 0 && (
					<div className="card-list">
						{searchResults.map((card) => (
							<div
								key={card.id}
								className="card-item"
								style={{
									border: "1px solid #ccc",
									margin: 8,
									padding: 8,
								}}
							>
								<strong>{card.name}</strong>{" "}
								<span>({card.mana_cost})</span>
								<br />
								<span>{card.type_line}</span>
								<br />
								{card.oracle_text && (
									<span style={{ fontSize: "0.9em" }}>
										{card.oracle_text}
									</span>
								)}
								<div
									style={{ fontSize: "0.8em", color: "#666" }}
								>
									{card.colors && card.colors.length > 0 && (
										<span>
											Colors: {card.colors.join(", ")}
										</span>
									)}
									{card.rarity && (
										<span> | Rarity: {card.rarity}</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
