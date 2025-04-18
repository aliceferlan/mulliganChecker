import { motion } from "framer-motion";
import React, { useState } from "react";
import { fetchSelectorList } from "@/app/lib/selectorListFetcher";
import { Type } from "@/app/types";

// Format status options
type FormatStatus = "none" | "legal" | "banned" | "notlegal";

// Extended Type to include status
interface FormatWithStatus extends Type {
	status: FormatStatus;
}

function FormatComponent({
	format,
	onStatusChange,
}: {
	format: Type;
	onStatusChange: (format: Type, status: FormatStatus) => void;
}) {
	const [status, setStatus] = useState<FormatStatus>("none");

	const statusColors = {
		none: "bg-gray-200",
		legal: "bg-green-500",
		banned: "bg-red-500",
		notlegal: "bg-yellow-500",
	};

	const handleClick = () => {
		// Cycle through statuses: none -> legal -> banned -> notlegal -> none
		const nextStatus: FormatStatus =
			status === "none"
				? "legal"
				: status === "legal"
				? "banned"
				: status === "banned"
				? "notlegal"
				: "none";

		setStatus(nextStatus);
		onStatusChange(format, nextStatus);
	};

	return (
		<button
			onClick={handleClick}
			className={`px-3 py-1 m-1 rounded-md text-white ${statusColors[status]}`}
		>
			{format.name || format.status} {status !== "none" && `(${status})`}
		</button>
	);
}

export default function FormatSelector() {
	const [selectedFormats, setSelectedFormats] = useState<FormatWithStatus[]>(
		[]
	);
	const [formats, setFormats] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch formats when component mounts
	React.useEffect(() => {
		async function loadFormats() {
			try {
				setIsLoading(true);
				// const fetchedFormats = await fetchSelectorList(
				// 	"https://api.scryfall.com/v1/sets"
				// );

				const fetchedFormats = [
					"Standard",
					"Modern",
					"Legacy",
					"Vintage",
				];

				setFormats(Array.isArray(fetchedFormats) ? fetchedFormats : []);
			} catch (err) {
				setError("Failed to load formats");
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		}

		loadFormats();
	}, []);

	const handleStatusChange = (format: Type, status: FormatStatus) => {
		if (status === "none") {
			// Remove format from selected formats
			setSelectedFormats((prev) =>
				prev.filter((f) => f.status !== format.status)
			);
		} else {
			// Add or update format in selected formats
			setSelectedFormats((prev) => {
				const existingIndex = prev.findIndex(
					(f) => f.status === format.status
				);
				if (existingIndex >= 0) {
					// Update existing format
					const updated = [...prev];
					updated[existingIndex] = { ...format, status };
					return updated;
				} else {
					// Add new format
					return [...prev, { ...format, status }];
				}
			});
		}
	};

	if (isLoading) return <div>Loading formats...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!formats || formats.length === 0)
		return <div>No formats available</div>;

	return (
		<div>
			<div className="format-selector mb-4">
				<h3 className="text-lg font-semibold mb-2">Select Formats</h3>
				<div className="flex flex-wrap">
					{formats.map((format) => (
						<FormatComponent
							key={format}
							format={{ name: format, status: "none" }}
							onStatusChange={handleStatusChange}
						/>
					))}
				</div>
			</div>

			<div className="selected-formats mt-4">
				<h3 className="text-lg font-semibold mb-2">Selected Formats</h3>
				{selectedFormats.length === 0 ? (
					<p>No formats selected</p>
				) : (
					<ul className="list-disc pl-6">
						{selectedFormats.map((format) => (
							<li key={format.status}>
								{format.name || format.name}:{" "}
								<span className="font-medium">
									{format.status}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
