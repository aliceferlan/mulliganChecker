"use client";

interface CardSet {
	cardName: string;
	number: number;
}

interface DeckList {
	List: CardSet[];
}

const deckList: CardSet[] = [
	{ cardName: "Forest", number: 1 },
	{ cardName: "Mountain", number: 2 },
	{ cardName: "Island", number: 3 },
	{ cardName: "Swamp", number: 4 },
	{ cardName: "Plains", number: 5 },
];

function createDeck(deckList: CardSet[]) {
	const deck: string[] = [];

	deckList.map((cardset) => {
		for (let i = 0; i < cardset.number; i++) {
			deck.push(cardset.cardName);
		}
	});

	const random = Math.random();

	console.log((random * 100) / deck.length);

	console.log(random);
	console.log(deck);
}

function drawHand(deck: string[]) {
	const hand: string[] = [];
	const shuffledDeck: string[] = [];

	// shuffledDeck.push(deck);
}

export default function Home() {
	return (
		<div>
			<textarea name="deck" id=""></textarea>
			<div>
				{/* コンソールエリア */}
				<button onClick={() => createDeck(deckList)}>条件の追加</button>
			</div>
			<div>{/* 表示エリア */}</div>
		</div>
	);
}
