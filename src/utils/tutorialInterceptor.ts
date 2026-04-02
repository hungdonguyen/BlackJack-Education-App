import { GameStore } from '@/types/game';
import { getRoomConfig } from './rooms';
import { getLessons } from '@/store/tutorialSlice';

/**
 * Checks if a game action is allowed during the current tutorial step.
 * If the action is not allowed, it triggers a warning notification and returns false.
 * 
 * @param state The current Zustand game store state
 * @param actionId The ID of the action being attempted (e.g. 'action-hit', 'chip-100')
 * @returns boolean True if allowed, false if blocked
 */
export function checkTutorialAction(state: GameStore, actionId: string): boolean {
    if (!state?.currentRoom) return true;
    
    // Safety try-catch for edge cases when accessing room configs
    try {
        const roomCfg = getRoomConfig(state.currentRoom);
        if (!roomCfg.isTutorial) return true;
    } catch {
        return true;
    }

    const { tutorialRound, tutorialStep } = state;
    
    const lessons = getLessons(state.currentRoom);

    const lesson = lessons[tutorialRound];
    
    if (!lesson) return true;

    const step = lesson.steps[tutorialStep];
    if (!step) return true;

    // Check if step enforces a specific action element
    if (step.targetElementId) {
        if (actionId === step.targetElementId) {
            return true; // Allowed
        } else {
            // Denied - tried wrong action
            if (state.showTutorialWarning) {
                // Special case for betting actions
                const isBettingAction = actionId.startsWith('chip-') || actionId.startsWith('seat-');
                const expectedBetting = step.targetElementId.startsWith('chip-') || step.targetElementId.startsWith('seat-');
                
                if (isBettingAction && expectedBetting) {
                    state.showTutorialWarning("Please bet $100 for this tutorial!");
                } else {
                    state.showTutorialWarning("Please perform the instructed action!");
                }
            }
            return false;
        }
    } else if (step.requiresClick) {
        // Enforcing reading the guide first if no target action is currently asked
        if (state.showTutorialWarning) {
            state.showTutorialWarning("Tap the guide bubble to continue!");
        }
        return false;
    }

    return true;
}
