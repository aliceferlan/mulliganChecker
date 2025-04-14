import { useState, useEffect, useRef } from "react";

export type Operator = "equal" | "large" | "small";
export type CMCSelection = { operator: Operator; value: number };

// 範囲選択用の型
type Range = { min: number; max: number };

type CMCSelectorProps = {
	onChange?: (selections: CMCSelection[]) => void;
	initialSelections?: CMCSelection[];
};

export default function CMCSelector({
	onChange,
	initialSelections = [],
}: CMCSelectorProps) {
	// 選択されたCMCの値を管理
	const [selections, setSelections] =
		useState<CMCSelection[]>(initialSelections);
	// 現在選択中の演算子
	const [currentOperator, setCurrentOperator] = useState<Operator>("equal");

	// ドラッグ操作のための状態
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<number | null>(null);
	const [dragEnd, setDragEnd] = useState<number | null>(null);

	// 選択された範囲を保存
	const [selectedRanges, setSelectedRanges] = useState<Range[]>([]);

	const barRef = useRef<HTMLDivElement>(null);

	// 数字の配列（0〜20）
	const numbers = Array.from({ length: 21 }, (_, i) => i);

	// 選択が変更されたら親コンポーネントに通知
	useEffect(() => {
		if (onChange) {
			onChange(selections);
		}
	}, [selections, onChange]);

	// 選択から範囲を計算
	useEffect(() => {
		// 直接範囲ペアとして選択された値を保存
		const ranges: Range[] = [];
		// 単独値（=）の選択を格納
		const equalValues: number[] = [];
		// large（>=）の値を格納
		const largeValues: number[] = [];
		// small（<=）の値を格納
		const smallValues: number[] = [];

		// selectionsからすべての選択を種類ごとに分類
		selections.forEach((selection) => {
			if (selection.operator === "equal") {
				equalValues.push(selection.value);
			} else if (selection.operator === "large") {
				largeValues.push(selection.value);
			} else if (selection.operator === "small") {
				smallValues.push(selection.value);
			}
		});

		// ペアになっている大きい/小さい条件を抽出
		// この配列にペアが見つかったindexを記録
		const usedIndices: number[] = [];

		// まず、同時に追加されたlargeとsmallのペアを検出
		for (let i = 0; i < selections.length - 1; i++) {
			if (usedIndices.includes(i)) continue;

			const current = selections[i];
			const next = selections[i + 1];

			// 連続するlargeとsmallのペアを見つけた場合
			if (
				current.operator === "large" &&
				next.operator === "small" &&
				current.value < next.value
			) {
				ranges.push({ min: current.value, max: next.value });
				usedIndices.push(i, i + 1);
				i++; // 次の項目はすでに処理したのでスキップ
			}
		}

		// 残りの単独のlargeを処理
		largeValues.forEach((value) => {
			// このlargeが既にrangeとして処理済みでないか確認
			const isUsed = selections.some(
				(selection, index) =>
					selection.operator === "large" &&
					selection.value === value &&
					usedIndices.includes(index)
			);

			if (!isUsed) {
				// 単独のlargeは「value以上〜上限なし」として扱う
				ranges.push({ min: value, max: 20 }); // 最大値を20とする
			}
		});

		// 残りの単独のsmallを処理
		smallValues.forEach((value) => {
			// このsmallが既にrangeとして処理済みでないか確認
			const isUsed = selections.some(
				(selection, index) =>
					selection.operator === "small" &&
					selection.value === value &&
					usedIndices.includes(index)
			);

			if (!isUsed) {
				// 単独のsmallは「0以上〜value以下」として扱う
				ranges.push({ min: 0, max: value }); // 最小値を0とする
			}
		});

		// 残りのequalをそれぞれ単一範囲として追加
		equalValues.forEach((value) => {
			ranges.push({ min: value, max: value });
		});

		setSelectedRanges(ranges);
	}, [selections]);

	// マウスダウン（ドラッグ開始）時の処理
	const handleMouseDown = (value: number) => {
		if (currentOperator === "equal") {
			// = ボタンが選択されている場合は、直接その値を追加する
			setSelections([...selections, { operator: "equal", value }]);
		} else {
			// >= または <= ボタンが選択されている場合は、直接その値と演算子を追加する
			setSelections([
				...selections,
				{ operator: currentOperator, value },
			]);
		}

		// ドラッグの準備も同時に行う
		setIsDragging(true);
		setDragStart(value);
		setDragEnd(value);
	};

	// マウス移動時の処理
	const handleMouseMove = (event: React.MouseEvent) => {
		if (!isDragging || !barRef.current) return;

		// バー内のマウス位置から値を計算
		const rect = barRef.current.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const width = rect.width;

		// 位置を0-20の値に変換
		const value = Math.min(20, Math.max(0, Math.round((x / width) * 20)));
		setDragEnd(value);
	};

	// マウスアップ（ドラッグ終了）時の処理
	const handleMouseUp = () => {
		if (!isDragging) return;

		if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
			// ドラッグの場合は、最後に追加したものをキャンセルして範囲を追加
			const minValue = Math.min(dragStart, dragEnd);
			const maxValue = Math.max(dragStart, dragEnd);

			// 単一クリックで追加したものはキャンセルする（最新の1つ）
			const newSelections = [...selections];
			newSelections.pop();

			// 範囲のために常にペアで追加する
			setSelections([
				...newSelections,
				{ operator: "large", value: minValue }, // 最小値以上
				{ operator: "small", value: maxValue }, // 最大値以下
			]);
		}

		// ドラッグ状態をリセット
		setIsDragging(false);
		setDragStart(null);
		setDragEnd(null);
	};

	// マウスがバーから出た時の処理
	const handleMouseLeave = () => {
		if (isDragging) {
			handleMouseUp();
		}
	};

	// 演算子ボタンをクリックしたときの処理
	const handleOperatorClick = (operator: Operator) => {
		setCurrentOperator(operator);
	};

	// 選択された値をクリアする
	const clearSelections = () => {
		setSelections([]);
		setSelectedRanges([]);
	};

	// 値が現在のドラッグ範囲内かチェック
	const isInDragRange = (value: number): boolean => {
		if (isDragging && dragStart !== null && dragEnd !== null) {
			const min = Math.min(dragStart, dragEnd);
			const max = Math.max(dragStart, dragEnd);
			return value >= min && value <= max;
		}
		return false;
	};

	// 値が選択済みの範囲内かチェック
	const isInSelectedRange = (value: number): boolean => {
		return selectedRanges.some(
			(range) => value >= range.min && value <= range.max
		);
	};

	// 選択結果を人間が読みやすい形式に変換
	const getSelectionText = () => {
		if (selectedRanges.length === 0) return "選択なし";

		return selectedRanges
			.map((range) => {
				if (range.min === range.max) {
					return `= ${range.min}`;
				} else if (range.min === 0) {
					return `CMC <= ${range.max}`;
				} else if (range.max === 20) {
					return `CMC >= ${range.min}`;
				} else {
					return `${range.min} <= CMC <= ${range.max}`;
				}
			})
			.join(", ");
	};

	return (
		<div className="flex flex-col items-center justify-center mt-4">
			<div className="w-full">
				<label className="block mb-2 font-medium">マナ総量</label>

				{/* 選択された値を表示 */}
				<div className="mb-2 p-2 bg-gray-100 rounded min-h-8 text-gray-600">
					{getSelectionText()}
				</div>

				{/* CMCのバー */}
				<div
					className="mb-4 relative w-full h-12 bg-gray-200 rounded"
					ref={barRef}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					onMouseUp={handleMouseUp}
				>
					{/* 数値目盛り */}
					<div className="flex justify-between absolute w-full px-2 text-gray-500">
						{numbers.map((num) => (
							<div
								key={num}
								className="w-1 h-6 flex items-center justify-center"
							>
								<span className="text-xs">{num}</span>
							</div>
						))}
					</div>

					{/* クリッカブルエリア */}
					<div className="flex absolute bottom-0 w-full">
						{numbers.map((num) => (
							<div
								key={num}
								onMouseDown={(e) => {
									e.preventDefault(); // テキスト選択を防止
									handleMouseDown(num);
								}}
								className={`h-6 flex-1 cursor-pointer border-r border-gray-300 relative 
                  ${isInDragRange(num) ? "bg-blue-300" : ""} 
                  ${
						isInSelectedRange(num) && !isInDragRange(num)
							? "bg-blue-500"
							: ""
					}
                `}
							>
								{/* ドラッグ開始点のマーカー */}
								{dragStart === num && isDragging && (
									<div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* 演算子ボタン */}
				<div className="flex space-x-4 justify-center mb-4">
					<button
						onClick={() => handleOperatorClick("small")}
						className={`px-4 py-2 rounded ${
							currentOperator === "small"
								? "bg-blue-500 text-white"
								: "bg-gray-200"
						}`}
					>
						&le;
					</button>
					<button
						onClick={() => handleOperatorClick("equal")}
						className={`px-4 py-2 rounded ${
							currentOperator === "equal"
								? "bg-blue-500 text-white"
								: "bg-gray-200"
						}`}
					>
						=
					</button>
					<button
						onClick={() => handleOperatorClick("large")}
						className={`px-4 py-2 rounded ${
							currentOperator === "large"
								? "bg-blue-500 text-white"
								: "bg-gray-200"
						}`}
					>
						&ge;
					</button>
					<button
						onClick={clearSelections}
						className="px-4 py-2 rounded bg-red-500 text-white"
					>
						クリア
					</button>
				</div>
			</div>
		</div>
	);
}
