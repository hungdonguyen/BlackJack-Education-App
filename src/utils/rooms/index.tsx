import { RoomConfig } from './types';
import { classic } from './classic';
import { vegasStrip } from './vegasStrip';
import { vegasDowntown } from './vegasDowntown';
import { freeAction } from './freeAction';
import { atlanticCity } from './atlanticCity';
import { iberian21 } from './iberian21';
import { uk } from './uk';
import { european } from './european';
import { zapout } from './zapout';
import { exchange } from './exchange';
import { firecard } from './firecard';
import { madness } from './madness';
import {
    tutorialBeginner,
    tutorialDouble,
    tutorialStrategy,
    tutorialCounting,
    tutorialSplitting,
    tutorialMultiHand,
    tutorialFreeAction,
    tutorialZapout,
    tutorialExchange,
    tutorialFirecard,
    tutorialMadness,
    tutorialIberian,
    tutorialEuropean,
    tutorialUk
} from './tutorials';

export * from './types';

export const ROOMS: Record<string, RoomConfig> = {
    classic,
    vegas_strip: vegasStrip,
    vegas_downtown: vegasDowntown,
    free_action: freeAction,
    atlantic_city: atlanticCity,
    iberian_21: iberian21,
    uk,
    european,
    zapout_21: zapout,
    exchange_21: exchange,
    firecard_21: firecard,
    madness_21: madness,
    tutorial_beginner: tutorialBeginner,
    tutorial_double: tutorialDouble,
    tutorial_strategy: tutorialStrategy,
    tutorial_counting: tutorialCounting,
    tutorial_splitting: tutorialSplitting,
    tutorial_multihand: tutorialMultiHand,
    tutorial_free_action: tutorialFreeAction,
    tutorial_zapout: tutorialZapout,
    tutorial_exchange: tutorialExchange,
    tutorial_firecard: tutorialFirecard,
    tutorial_madness: tutorialMadness,
    tutorial_iberian: tutorialIberian,
    tutorial_european: tutorialEuropean,
    tutorial_uk: tutorialUk,
};

const lobbyRooms = Object.values(ROOMS).filter((room) => !room.isTutorial);
const stableRooms = lobbyRooms.filter((room) => !room.isBeta);
const betaRooms = lobbyRooms.filter((room) => room.isBeta);

export const LOBBY_ROOMS: RoomConfig[] = [...stableRooms, ...betaRooms];

export function getLobbyRooms(): RoomConfig[] {
    return [...LOBBY_ROOMS];
}

export function getRoomConfig(roomId: string): RoomConfig {
    return ROOMS[roomId] ?? ROOMS.classic;
}
