import { useState, useEffect, useRef } from "react";

type Type = {
	id: string; // タイプのID
	name: string; // タイプの名前
};

// 実際のMTGのタイプリスト
function getTypeList(): Type[] {
	return [
		{ id: "1", name: "Creature" },
		{ id: "2", name: "Artifact" },
		{ id: "3", name: "Enchantment" },
		{ id: "4", name: "Instant" },
		{ id: "5", name: "Sorcery" },
		{ id: "6", name: "Planeswalker" },
		{ id: "7", name: "Land" },
		{ id: "8", name: "Battle" },
		// サブタイプ
		{ id: "100", name: "Human" },
		{ id: "101", name: "Elf" },
		{ id: "102", name: "Goblin" },
		{ id: "103", name: "Zombie" },
		{ id: "104", name: "Wizard" },
		{ id: "105", name: "Equipment" },
		{ id: "106", name: "Aura" },
		{ id: "107", name: "Vehicle" },
		{ id: "108", name: "Dragon" },
		// 特殊タイプ
		{ id: "200", name: "Legendary" },
		{ id: "201", name: "Basic" },
		{ id: "202", name: "Snow" },
		{ id: "203", name: "Token" },
		{ id: "204", name: "Tribal" },
	];
}

type TypeSelectorProps = {
	onChange?: (selectedTypes: string[]) => void;
	initialSelection?: string[];
};

export default function TypeSelector({
	onChange,
	initialSelection = [],
}: TypeSelectorProps) {
	const typeList = getTypeList(); // タイプのリストを取得
	const [selectedTypes, setSelectedTypes] =
		useState<string[]>(initialSelection); // 選択されたタイプを管理
	const [inputValue, setInputValue] = useState<string>(""); // 入力値を管理
	const [suggestions, setSuggestions] = useState<Type[]>([]); // サジェストを管理
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false); // サジェスト表示の制御

	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionRef = useRef<HTMLDivElement>(null);

	// 選択が変更されたら親コンポーネントに通知
	useEffect(() => {
		if (onChange) {
			onChange(selectedTypes);
		}
	}, [selectedTypes, onChange]);

	// 入力値が変更されたらサジェストを更新
	useEffect(() => {
		if (inputValue.trim() === "") {
			setSuggestions([]);
			return;
		}

		const filtered = typeList.filter(
			(type) =>
				!selectedTypes.includes(type.name) && // すでに選択されていないもの
				type.name.toLowerCase().includes(inputValue.toLowerCase()) // 入力値にマッチするもの
		);

		setSuggestions(filtered);
		setShowSuggestions(filtered.length > 0);
	}, [inputValue, typeList, selectedTypes]);

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

	// サジェストがクリックされたときの処理
	const handleSuggestionClick = (typeName: string) => {
		if (!selectedTypes.includes(typeName)) {
			setSelectedTypes([...selectedTypes, typeName]);
		}
		setInputValue("");
		setShowSuggestions(false);

		// 入力フォームにフォーカスを戻す
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	// 選択されたタイプを削除する処理
	const removeType = (typeName: string) => {
		setSelectedTypes(selectedTypes.filter((type) => type !== typeName));
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
				{selectedTypes.map((type) => (
					<div
						key={type}
						className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center text-sm"
					>
						<span>{type}</span>
						<button
							onClick={() => removeType(type)}
							className="ml-1 text-blue-500 hover:text-blue-700"
						>
							&times;
						</button>
					</div>
				))}
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
								key={type.id}
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
