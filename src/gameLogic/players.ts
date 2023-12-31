import { cardScoreValues } from './deck';
import { type GamePlayer, type TableCard } from '../types';

export function createPlayer(id: string, userName: string): GamePlayer {
  const player = {
    id,
    userName,
    hand: [] as string[],
    score: 0,
    wonCardsTotal: 0,
    isPicker: false,
    wonCards: [] as string[],
    cardToPlay: {} as TableCard,
    makePicker: (cards: string[]) => {
      player.isPicker = true;
      player.wonCards.push(...cards);
    },
    playCard: (card: string) => {
      const index = player.hand.indexOf(card);
      player.hand.splice(index, 1);
      player.cardToPlay = {
        card,
        player: player.id
      };
    },
    getTotalForCards: () => {
      /*
      Ace - 11 points
      Ten - 10 points
      King - 4 points
      Queen 3 points
      Jack - 2 points
      9, 8, 7 - no points
      */
      player.wonCards.forEach((c: string) => {
        const split = c.split('');
        const cardType = split[0];
        // const suit = split[1]; // this might not matter
        player.wonCardsTotal += cardScoreValues[cardType];
      });
    },
    resetForNextTurn: () => {
      player.hand = [];
      player.isPicker = false;
      player.cardToPlay = {} as TableCard;
    },
    resetForNextRound: () => {
      // if each round is from setting gameMode to scoring
      player.resetForNextTurn();
      player.wonCards = [];
      player.wonCardsTotal = 0;
    },
    resetForNewGame: () => {
      // wipe all
      player.resetForNextRound();
      player.score = 0;
    }
  };
  return player;
}
