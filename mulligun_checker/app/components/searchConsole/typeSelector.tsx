import React, { useState, useEffect, useRef } from "react";
import { Type } from "@/app/types";

// デフォルトのMTGタイプリスト - コンポーネント外で一度だけ定義
const DEFAULT_TYPE_LIST: Type[] = [
	{ status: "1", name: "Creature" },
	{ status: "2", name: "Artifact" },
	{ status: "3", name: "Enchantment" },
	{ status: "4", name: "Instant" },
	{ status: "5", name: "Sorcery" },
	{ status: "6", name: "Planeswalker" },
	{ status: "7", name: "Land" },
	{ status: "8", name: "Battle" },
	// サブタイプ
	{ status: "100", name: "Human" },
	{ status: "101", name: "Elf" },
	{ status: "102", name: "Goblin" },
	{ status: "103", name: "Zombie" },
	{ status: "104", name: "Wizard" },
	{ status: "105", name: "Equipment" },
	{ status: "106", name: "Aura" },
	{ status: "107", name: "Vehicle" },
	{ status: "108", name: "Dragon" },
	// 特殊タイプ
	{ status: "200", name: "Legendary" },
	{ status: "201", name: "Basic" },
	{ status: "202", name: "Snow" },
	{ status: "203", name: "Token" },
	{ status: "204", name: "Tribal" },
];

// 選択したタイプの状態を表す型
type SelectedType = {
	name: string;
	include: boolean; // true: 含む, false: 含まない
};

// タイプ間の接続方法
type ConnectionType = "AND" | "OR";

// タイプ間の接続情報を管理
type Connection = {
	type: ConnectionType;
	index: number; // 何番目と何番目の間の接続か
};

type TypeSelectorProps = {
	onChange?: (query: string) => void;
	initialSelection?: string[];
	typeList?: Type[]; // 追加：カスタムタイプリスト
};

export default function TypeSelector({
	onChange,
	initialSelection = [],
	typeList = DEFAULT_TYPE_LIST, // デフォルト値を設定
}: TypeSelectorProps) {
	// 選択されたタイプと状態の管理
	const [selectedTypes, setSelectedTypes] = useState<SelectedType[]>(
		initialSelection.map((name) => ({ name, include: true }))
	);

	// 接続方法の管理（インデックスごとに接続方法を保持）
	// connections[0]は1番目と2番目の間の接続、connections[1]は2番目と3番目の間の接続...
	const [connections, setConnections] = useState<ConnectionType[]>(
		Array(Math.max(0, initialSelection.length - 1)).fill("AND")
	);

	const [inputValue, setInputValue] = useState<string>(""); // 入力値を管理
	const [suggestions, setSuggestions] = useState<Type[]>([]); // サジェストを管理
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false); // サジェスト表示の制御

	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionRef = useRef<HTMLDivElement>(null);

	// 選択が変更されたら親コンポーネントに通知
	useEffect(() => {
		if (onChange) {
			// 検索クエリを構築
			const query = buildSearchQuery();
			onChange(query);
		}
	}, [selectedTypes, connections, onChange]);

	// 検索クエリ構築関数
	const buildSearchQuery = (): string => {
		if (selectedTypes.length === 0) return "";

		// AND/ORが混在しているか確認
		const hasMixedConnections =
			connections.some((conn) => conn === "OR") &&
			connections.some((conn) => conn === "AND");

		// クエリ構築（最初のタイプから）
		let query = "";

		if (hasMixedConnections) {
			// AND/ORが混在する場合、ANDでつながれた部分を括弧で括る
			// まずANDで連結されたグループを特定
			let currentGroup: string[] = [
				`${selectedTypes[0].include ? "" : "-"}${
					selectedTypes[0].name
				}`,
			];
			let groupType: ConnectionType | null = null;
			let result: string[] = [];

			// 各接続とタイプを処理
			for (let i = 0; i < connections.length; i++) {
				const connection = connections[i];
				const nextType = `${selectedTypes[i + 1].include ? "" : "-"}${
					selectedTypes[i + 1].name
				}`;

				// 最初のグループまたは同じ接続タイプが続く場合
				if (groupType === null || groupType === connection) {
					currentGroup.push(nextType);
					groupType = connection;
				} else {
					// 接続タイプが変わる場合、前のグループを確定
					if (groupType === "AND" && currentGroup.length > 1) {
						// ANDグループは括弧で括る
						result.push(`(${currentGroup.join(" AND ")})`);
					} else {
						// ORグループはそのまま追加
						result.push(currentGroup.join(" OR "));
					}
					// 新しいグループを開始
					currentGroup = [nextType];
					groupType = connection;
				}
			}

			// 最後のグループを処理
			if (currentGroup.length > 0) {
				if (groupType === "AND" && currentGroup.length > 1) {
					result.push(`(${currentGroup.join(" AND ")})`);
				} else {
					result.push(currentGroup.join(` ${groupType} `));
				}
			}

			// 最終的な結合（ORで結合）
			query = result.join(" OR ");
		} else {
			// 混在していない場合は単純に結合
			const connectionType =
				connections.length > 0 ? connections[0] : "AND";
			const typeQueries = selectedTypes.map(
				(type) => `${type.include ? "" : "-"}${type.name}`
			);
			query = typeQueries.join(` ${connectionType} `);
		}

		return query;
	};

	// 入力値が変更されたらサジェストを更新
	useEffect(() => {
		if (inputValue.trim() === "") {
			setSuggestions([]);
			return;
		}

		const filtered = typeList.filter(
			(type) =>
				!selectedTypes.some(
					(selected) => selected.name === type.name
				) && // すでに選択されていないもの
				type.name.toLowerCase().includes(inputValue.toLowerCase()) // 入力値にマッチするもの
		);

		// 入力値が完全に一致するタイプがある場合は自動選択
		const exactMatch = filtered.find(
			(type) => type.name.toLowerCase() === inputValue.toLowerCase()
		);

		if (exactMatch) {
			handleSuggestionClick(exactMatch.name);
			return;
		}

		setSuggestions(filtered);
		setShowSuggestions(filtered.length > 0);
	}, [inputValue, selectedTypes, typeList]);

	// handleSuggestionClickを参照するため、useEffect内で使用できるように関数を定義
	const handleSuggestionClick = (typeName: string) => {
		if (!selectedTypes.some((type) => type.name === typeName)) {
			setSelectedTypes([
				...selectedTypes,
				{ name: typeName, include: true },
			]);

			// 新しい接続を追加（デフォルトはAND）
			if (selectedTypes.length > 0) {
				setConnections([...connections, "AND"]);
			}
		}
		setInputValue("");
		setShowSuggestions(false);

		// 入力フォームにフォーカスを戻す
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	// 選択済みタイプの含む/含まない状態を切り替え
	const toggleTypeInclusion = (typeName: string) => {
		setSelectedTypes(
			selectedTypes.map((type) =>
				type.name === typeName
					? { ...type, include: !type.include }
					: type
			)
		);
	};

	// 特定の接続方法を切り替え
	const toggleConnection = (index: number) => {
		setConnections(
			connections.map((conn, i) =>
				i === index ? (conn === "AND" ? "OR" : "AND") : conn
			)
		);
	};

	// 選択されたタイプを削除する処理
	const removeType = (index: number) => {
		// タイプを削除
		setSelectedTypes(selectedTypes.filter((_, i) => i !== index));

		// 接続も適切に更新
		if (index === 0 && connections.length > 0) {
			// 最初のタイプが削除された場合、最初の接続も削除
			setConnections(connections.slice(1));
		} else if (
			index === selectedTypes.length - 1 &&
			connections.length > 0
		) {
			// 最後のタイプが削除された場合、最後の接続を削除
			setConnections(connections.slice(0, -1));
		} else if (index > 0 && index < selectedTypes.length - 1) {
			// 中間のタイプが削除された場合、その前後の接続を結合
			// 例：[AND, OR, AND]でindex=1のタイプを削除すると、[AND, AND]になる
			const newConnections = [...connections];
			newConnections.splice(index - 1, 2, connections[index - 1]);
			setConnections(newConnections);
		}
	};

	// サジェスト以外をクリックしたらサジェストを閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionRef.current &&
				!suggestionRef.current.contains(event.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// 入力値が変更されたときの処理
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		setShowSuggestions(true);
	};

	// キー入力時の処理（Enterキーでタイプを追加、ESCキーでサジェストを閉じる）
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && inputValue.trim() !== "") {
			// サジェストの最初の項目を選択
			if (suggestions.length > 0) {
				handleSuggestionClick(suggestions[0].name);
				e.preventDefault();
			}
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
		}
	};

	return (
		<div className="w-full">
			<label className="block mb-2 font-medium">タイプ</label>

			{/* 選択されたタイプを表示 */}
			<div className="flex flex-wrap gap-1 mb-2">
				{selectedTypes.length > 0 && (
					<div className="flex flex-wrap gap-1 items-center">
						{selectedTypes.map((type, index) => (
							<React.Fragment key={`${type.name}-${index}`}>
								{index > 0 && (
									<div
										onClick={() =>
											toggleConnection(index - 1)
										}
										className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md cursor-pointer text-sm hover:bg-gray-300"
									>
										{connections[index - 1]}
									</div>
								)}
								<div
									onClick={() =>
										toggleTypeInclusion(type.name)
									}
									className={`px-2 py-1 rounded-md flex items-center text-sm cursor-pointer ${
										type.include
											? "bg-blue-100 text-blue-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									<span>
										{type.include ? "" : "-"}
										{type.name}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation(); // クリックイベントの伝播を停止
											removeType(index);
										}}
										className="ml-1 text-gray-500 hover:text-gray-700"
									>
										&times;
									</button>
								</div>
							</React.Fragment>
						))}
					</div>
				)}
			</div>

			{/* 入力フィールドとサジェスト */}
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onClick={() => setShowSuggestions(inputValue.trim() !== "")}
					placeholder="タイプを入力..."
					className="w-full p-2 border rounded-md"
				/>

				{/* サジェスト一覧 */}
				{showSuggestions && (
					<div
						ref={suggestionRef}
						className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border rounded-md shadow-lg"
					>
						{suggestions.map((type) => (
							<div
								key={type.status}
								onClick={() => handleSuggestionClick(type.name)}
								className="p-2 hover:bg-gray-100 cursor-pointer"
							>
								{type.name}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
