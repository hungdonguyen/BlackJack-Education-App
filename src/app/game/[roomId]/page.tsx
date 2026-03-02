'use client';

// ============================================
// Game Room Page — Dynamic table based on roomId
// ============================================

import { use } from 'react';
import Table from '@/components/Table';

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);

    return <Table roomId={roomId} />;
}
