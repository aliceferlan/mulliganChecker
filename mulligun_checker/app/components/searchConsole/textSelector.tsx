export default function TextSelector({ id }: { id: string }) {
	return (
		<div className="search-console__input" key={id}>
			<input type="text" placeholder={id} />
		</div>
	);
}
