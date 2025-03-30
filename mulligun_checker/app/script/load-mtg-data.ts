// scripts/load-mtg-data.ts
import { saveCard } from '../lib/cards';
const mtg = require('mtgsdk');

async function loadInitialData() {
    try {
        // 人気のあるセットのコード
        const popularSets = ['M21', 'ZNR', 'KHM', 'STX', 'MH2', 'AFR', 'MID', 'VOW', 'NEO', 'SNC'];

        for (const setCode of popularSets) {
            console.log(`Loading cards from set ${setCode}...`);

            const cards = await mtg.card.where({ set: setCode });
            console.log(`Found ${cards.length} cards in set ${setCode}`);

            for (const card of cards) {
                saveCard(card);
            }

            console.log(`Saved all cards from set ${setCode}`);
        }

        console.log('Initial data loading completed');
    } catch (error) {
        console.error('Error loading initial ', error);
    }
}

loadInitialData();
