import React from 'react';
import { FlaskConical } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';

interface StrategySwitchTabProps {
    room: RoomConfig;
}

export const StrategySwitchTab: React.FC<StrategySwitchTabProps> = ({ room }) => {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border p-5" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)' }}>
                <div className="flex items-start gap-4">
                    <FlaskConical size={20} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400 mb-1">Under Development</p>
                        <p className="text-[13px] text-orange-300 font-semibold leading-relaxed">
                            The Switch/Exchange Advice engine for {room.name} is currently being refined.
                        </p>
                        <p className="text-[11px] text-orange-300/60 mt-2 leading-relaxed">
                            Calculating the optimal swap depends on thousands of permutations of potential dealer outcomes and multi-hand equity. Check back in a future update for full matrix support.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <p className="text-[11px] font-bold text-white/80 mb-2 uppercase tracking-wider">General Exchange Principles</p>
                <ul className="space-y-3">
                    <li className="flex gap-3 text-[11px] text-white/50 leading-relaxed">
                        <span className="font-bold text-emerald-400">01</span>
                        <span>Prioritize creating a Blackjack. If exchanging a card can make an Ace-Ten combo, it is almost always the correct play.</span>
                    </li>
                    <li className="flex gap-3 text-[11px] text-white/50 leading-relaxed">
                        <span className="font-bold text-emerald-400">02</span>
                        <span>Improve strong totals. Swapping a 10 into a 5-6 combo (making 11) is significantly higher EV than keeping a soft 15.</span>
                    </li>
                    <li className="flex gap-3 text-[11px] text-white/50 leading-relaxed">
                        <span className="font-bold text-emerald-400">03</span>
                        <span>Break up "stiff" hands. If both hands are 12-16, try to consolidate the cards into one strong standing hand.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
