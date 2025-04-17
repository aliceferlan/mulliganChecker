import { div } from "framer-motion/client";
import React, { useState } from "react";

export default function FormatSelector() {
	return (
		<div>
			<div className="format-selector">
				<select name="format" id="format">
					<option value="standard">Standard</option>
					<option value="modern">Modern</option>
					<option value="legacy">Legacy</option>
					<option value="commander">Commander</option>
				</select>
			</div>
		</div>
	);
}
