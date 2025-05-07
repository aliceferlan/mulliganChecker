import { useState, FormEvent, useRef, useEffect } from "react";

// テキストデータの型定義
type OracleText = {
	text: string;
	exclude: boolean;
};

// オラクル検索の状態を表す型
type OracleState = {
	texts: OracleText[];
	operator: "and" | "or";
};

// OracleSelectorのプロパティ型定義
interface OracleSelectorProps {
	onChange: (query: string) => void;
}

export default function OracleSelector({ onChange }: OracleSelectorProps) {
	// 状態管理
	const [state, setState] = useState<OracleState>({
		texts: [],
		operator: "and",
	});
	const [inputValue, setInputValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	// stateが変更されたときにonChangeを呼び出す
	useEffect(() => {
		const queryParts = state.texts.map((item) => {
			return item.exclude ? `NOT "${item.text}"` : `"${item.text}"`;
		});
		if (queryParts.length === 0) {
			onChange("");
			return;
		}
		const queryString = queryParts.join(
			` ${state.operator.toUpperCase()} `
		);
		onChange(queryString);
	}, [state, onChange]);

	// フォーム送信時の処理
	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (inputValue.trim()) {
			setState((prev) => ({
				...prev,
				texts: [
					...prev.texts,
					{ text: inputValue.trim(), exclude: false },
				],
			}));
			setInputValue("");
			// フォーカスを入力フィールドに戻す
			setTimeout(() => inputRef.current?.focus(), 0);
		}
	};

	// テキストの除外状態を切り替える
	const toggleExclude = (index: number) => {
		setState((prev) => {
			const newTexts = [...prev.texts];
			newTexts[index] = {
				...newTexts[index],
				exclude: !newTexts[index].exclude,
			};
			return { ...prev, texts: newTexts };
		});
	};

	// オペレータ（AND/OR）を切り替える
	const toggleOperator = () => {
		setState((prev) => ({
			...prev,
			operator: prev.operator === "and" ? "or" : "and",
		}));
	};

	// テキストを削除する
	const removeText = (index: number) => {
		setState((prev) => ({
			...prev,
			texts: prev.texts.filter((_, i) => i !== index),
		}));
	};

	return (
		<div className="w-full">
			{/* 選択されたテキストの表示エリア */}
			{state.texts.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3 p-2 border border-gray-300 rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
					{state.texts.map((item, index) => (
						<div key={index} className="flex items-center">
							{index > 0 && (
								<span
									className="mx-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
									onClick={toggleOperator}
								>
									{state.operator.toUpperCase()}
								</span>
							)}
							<div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
								<span
									className={`cursor-pointer ${
										item.exclude
											? "line-through text-red-600 dark:text-red-400"
											: "text-gray-800 dark:text-gray-200"
									}`}
									onClick={() => toggleExclude(index)}
								>
									{item.exclude
										? `NOT ${item.text}`
										: item.text}
								</span>
								<button
									className="ml-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
									onClick={() => removeText(index)}
									aria-label="Remove"
								>
									×
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* テキスト入力フォーム */}
			<form onSubmit={handleSubmit} className="w-full">
				<div className="flex">
					<input
						type="text"
						placeholder="Oracle Text..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						ref={inputRef}
						className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
					/>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
					>
						Submit
					</button>
				</div>
			</form>
		</div>
	);
}
