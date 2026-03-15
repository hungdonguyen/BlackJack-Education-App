// ============================================
// Main Game Store — combines slices with Zustand persist middleware
// ============================================

import { create } from 'zustand';
import { GameStore } from '@/types/game';
import { createBettingSlice } from './bettingSlice';
import { createGameFlowSlice } from './gameFlowSlice';
import { createSettingsSlice } from './settingsSlice';
import { createDevToolsSlice } from './devToolsSlice';

export const useGameStoreBase = create<GameStore>()((...a) => ({
  ...createBettingSlice(...a),
  ...createGameFlowSlice(...a),
  ...createSettingsSlice(...a),
  ...createDevToolsSlice(...a),
}));
