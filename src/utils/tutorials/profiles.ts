export type TutorialSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TutorialToneProfile = 'gentle' | 'coach' | 'pro';

export interface TutorialProfile {
    level: TutorialSkillLevel;
    tone: TutorialToneProfile;
    tags: string[];
}

const DEFAULT_PROFILE: TutorialProfile = {
    level: 'Beginner',
    tone: 'gentle',
    tags: ['Core'],
};

const PROFILE_BY_ROOM: Record<string, TutorialProfile> = {
    tutorial_beginner: { level: 'Beginner', tone: 'gentle', tags: ['Core Basics', 'Table Flow'] },
    tutorial_double: { level: 'Beginner', tone: 'gentle', tags: ['Double Down', 'Risk Control'] },
    tutorial_strategy: { level: 'Beginner', tone: 'gentle', tags: ['Basic Strategy', 'Decision Map'] },
    tutorial_splitting: { level: 'Intermediate', tone: 'coach', tags: ['Pair Rules', 'EV Discipline'] },
    tutorial_multihand: { level: 'Intermediate', tone: 'coach', tags: ['Multi Seat', 'Turn Flow'] },
    tutorial_counting: { level: 'Advanced', tone: 'pro', tags: ['Hi-Lo', 'Deviations'] },
    tutorial_free_action: { level: 'Intermediate', tone: 'coach', tags: ['Free Bets', 'Push 22'] },
    tutorial_zapout: { level: 'Intermediate', tone: 'coach', tags: ['Zap Out', 'Push 22'] },
    tutorial_exchange: { level: 'Advanced', tone: 'pro', tags: ['Switch EV', '2-Hand Logic'] },
    tutorial_firecard: { level: 'Intermediate', tone: 'coach', tags: ['Burn Card', 'Bonus Traps'] },
    tutorial_madness: { level: 'Advanced', tone: 'pro', tags: ['Infinite Double', 'Push 22'] },
    tutorial_iberian: { level: 'Advanced', tone: 'pro', tags: ['Spanish Deck', 'Rescue'] },
    tutorial_european: { level: 'Intermediate', tone: 'coach', tags: ['ENHC', 'Restrictions'] },
    tutorial_uk: { level: 'Intermediate', tone: 'coach', tags: ['OBO', 'DAS'] },
};

export function getTutorialProfile(roomId: string): TutorialProfile {
    return PROFILE_BY_ROOM[roomId] ?? DEFAULT_PROFILE;
}

export function getLevelRank(level: TutorialSkillLevel): number {
    if (level === 'Beginner') return 0;
    if (level === 'Intermediate') return 1;
    return 2;
}
