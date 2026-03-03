// ============================================
// Game Room Page — Dynamic table based on roomId
// ============================================

import GameClient from './GameClient';
import { ROOMS } from '@/utils/rooms';

export function generateStaticParams() {
    return Object.keys(ROOMS).map((roomId) => ({ roomId }));
}

export default async function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;

    return <GameClient roomId={roomId} />;
}
