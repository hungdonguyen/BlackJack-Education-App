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

const TUTORIAL_SEQUENCE_BY_ROOM: Record<string, number> = {
    // Beginner - Classic fundamentals
    tutorial_beginner: 10,
    tutorial_double: 20,
    tutorial_strategy: 30,

    // Intermediate - Classic/standard variants
    tutorial_splitting: 40,
    tutorial_multihand: 50,
    tutorial_european: 60,
    tutorial_uk: 70,

    // Intermediate - Special rules
    tutorial_free_action: 80,
    tutorial_zapout: 90,
    tutorial_firecard: 100,

    // Advanced - Classic to special
    tutorial_counting: 110,
    tutorial_exchange: 120,
    tutorial_madness: 130,
    tutorial_iberian: 140,
};

export function getTutorialProfile(roomId: string): TutorialProfile {
    return PROFILE_BY_ROOM[roomId] ?? DEFAULT_PROFILE;
}

export function getLevelRank(level: TutorialSkillLevel): number {
    if (level === 'Beginner') return 0;
    if (level === 'Intermediate') return 1;
    return 2;
}

export function getTutorialSequenceRank(roomId: string): number {
    return TUTORIAL_SEQUENCE_BY_ROOM[roomId] ?? Number.MAX_SAFE_INTEGER;
}
