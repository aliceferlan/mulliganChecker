import { useState, useRef, useEffect } from "react";

export default function TextSelector({ id }: { id: string }) {
	const cardType = [
		"planeswalker",
		"creature",
		"artifact",
		"enchantment",
		"plaine",
		"island",
		"swamp",
		"mountain",
		"forest",
		"land",
		"instant",
		"tribal",
		"sorcery",
		"conspiracy",
		"phenomenon",
		"plane",
		"vanguard",
	];

	const [selectedType, setSelectedType] = useState<string[]>([]);
	const [inputValue, setInputValue] = useState<string>("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// 入力値が変更されたときの処理
	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value.toLowerCase();
		setInputValue(value);

		// サジェスト表示のロジック
		if (value.length > 0) {
			const filteredSuggestions = cardType.filter(
				(type) =>
					type.toLowerCase().includes(value) &&
					!selectedType.includes(type)
			);
			setSuggestions(filteredSuggestions);
			setShowSuggestions(filteredSuggestions.length > 0);
		} else {
			setSuggestions([]);
			setShowSuggestions(false);
		}
		e.preventDefault();
		addTypeFromInput();
	}

	// 入力値からタイプを追加
	function addTypeFromInput() {
		const value = inputValue.toLowerCase();

		// カードタイプリストに存在し、かつまだ選択されていない場合
		if (cardType.includes(value) && !selectedType.includes(value)) {
			setSelectedType([...selectedType, value]);
			setInputValue(""); // 入力欄をクリア
			setShowSuggestions(false);
		}
	}

	// サジェストリストからタイプを選択
	function selectSuggestion(type: string) {
		if (!selectedType.includes(type)) {
			setSelectedType([...selectedType, type]);
			setInputValue(""); // 入力欄をクリア
			setShowSuggestions(false);
		}
	}

	// 選択したタイプを削除
	function removeSelectedType(type: string) {
		setSelectedType(selectedType.filter((t) => t !== type));
	}

	// 選択肢の外側をクリックしたときにサジェストを閉じる
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div className="text-selector">
			<div className="search-console__input" key={id}>
				<div className="input-container" ref={inputRef}>
					<input
						type="text"
						placeholder={id}
						id={"input-" + id}
						value={inputValue}
						onChange={handleInputChange}
						onFocus={() =>
							inputValue.length > 0 &&
							setSuggestions(
								cardType.filter(
									(type) =>
										type.includes(
											inputValue.toLowerCase()
										) && !selectedType.includes(type)
								)
							)
						}
					/>

					{/* サジェストリスト */}
					{showSuggestions && (
						<ul className="suggestion-list">
							{suggestions.map((suggestion) => (
								<li
									key={suggestion}
									onClick={() => selectSuggestion(suggestion)}
									className="suggestion-item"
								>
									{suggestion}
								</li>
							))}
						</ul>
					)}
				</div>

				{/* 選択されたタイプ表示エリア */}
				<div className="selected-types">
					{selectedType.map((type) => (
						<div key={type} className="selected-type-tag">
							{type}
							<span
								className="remove-tag"
								onClick={() => removeSelectedType(type)}
							>
								×
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
