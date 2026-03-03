'use client';

import Table from '@/components/Table';

export default function GameClient({ roomId }: { roomId: string }) {
    return <Table roomId={roomId} />;
}
