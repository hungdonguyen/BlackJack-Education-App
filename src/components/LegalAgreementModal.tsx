'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { isTauriEnv, writeSaveFile, readSaveFile } from '@/utils/saveFile';

const AGREEMENT_KEY = 'legal-agreed-v1';

/** Persist acceptance flag: localStorage (browser), save.json supplement in Tauri */
async function hasAccepted(): Promise<boolean> {
    if (typeof window === 'undefined') return true; // SSR: skip
    const local = localStorage.getItem(AGREEMENT_KEY);
    if (local === 'true') return true;
    if (isTauriEnv()) {
        try {
            const content = await readSaveFile();
            if (content) {
                const parsed = JSON.parse(content);
                if (parsed?.legalAgreed === true) return true;
            }
        } catch { /* ignore */ }
    }
    return false;
}

async function persistAcceptance(): Promise<void> {
    localStorage.setItem(AGREEMENT_KEY, 'true');
    if (isTauriEnv()) {
        try {
            const content = await readSaveFile();
            const parsed = content ? JSON.parse(content) : {};
            parsed.legalAgreed = true;
            await writeSaveFile(JSON.stringify(parsed));
        } catch { /* ignore */ }
    }
}

// ─── Content ─────────────────────────────────────────────────────────────────

const PRIVACY_CONTENT = [
    {
        title: '1. Introduction',
        body: 'Educational Blackjack ("the App") is a free, offline educational card game application. We are committed to protecting your privacy. This Privacy Policy explains what data the App does — and does not — collect.',
    },
    {
        title: '2. Data Collection',
        body: 'We collect absolutely no personal data. The App operates 100% offline — it makes no network requests whatsoever. No analytics, tracking, or telemetry of any kind. No cookies or web beacons. No user accounts, registration, or authentication. No advertising or ad-related data collection.',
    },
    {
        title: '3. Local Storage',
        body: 'The App stores data locally on your device only: virtual bankroll balance (no real monetary value), game history records for educational review, and daily claim status. This data is stored in your OS application data directory and never leaves your device. You can delete it at any time by uninstalling the app.',
    },
    {
        title: '4. Third-Party Services',
        body: 'The App uses no third-party services, APIs, SDKs, or external libraries that collect, process, or transmit user data.',
    },
    {
        title: '5. GDPR Compliance (EU)',
        body: 'Since the App collects no personal data and processes no information about identifiable individuals, the provisions of the GDPR do not impose specific obligations. No consent mechanism is required because there is nothing to consent to.',
    },
    {
        title: '6. CCPA Compliance (California, US)',
        body: 'The App does not collect, sell, or share any personal information as defined by the CCPA. There is no personal information to disclose, delete, or opt out from selling.',
    },
    {
        title: '7. Children\'s Privacy',
        body: 'This App simulates gambling mechanics for educational purposes and is intended for users aged 18 and above. It does not knowingly collect any data from children or any other users.',
    },
    {
        title: '8. Changes to This Policy',
        body: 'We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date at the top of the page.',
    },
];

const TERMS_CONTENT = [
    {
        title: '1. Acceptance of Terms',
        body: 'By downloading, installing, or using Educational Blackjack ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.',
    },
    {
        title: '2. Nature of the Application',
        body: 'This App is strictly for educational and entertainment purposes. No real money is involved at any stage — all currency within the App is virtual and has absolutely no monetary value. The App cannot be used for real-money gambling. Virtual chips cannot be exchanged, transferred, or redeemed for real currency, goods, or services.',
    },
    {
        title: '3. Age Restriction — 18+',
        body: 'This App contains simulated gambling content (18+). By using this App, you confirm that you are at least 18 years of age or the age of majority in your jurisdiction, whichever is higher. The App is not intended for use by minors.',
    },
    {
        title: '4. Fair Play & Randomness',
        body: 'The App uses a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) via the Web Crypto API (crypto.getRandomValues()) for all card shuffling operations. This ensures that card outcomes are statistically unbiased and cannot be predicted or manipulated.',
    },
    {
        title: '5. Intellectual Property',
        body: 'The App\'s source code, design, and original assets are the intellectual property of the developer. Standard playing card designs and Blackjack game rules are in the public domain.',
    },
    {
        title: '6. Disclaimer of Warranties',
        body: 'The App is provided "AS IS" without warranty of any kind, express or implied. The developer does not warrant that the App will be error-free or uninterrupted.',
    },
    {
        title: '7. Limitation of Liability',
        body: 'In no event shall the developer be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of use of the App. Since the App involves no real money, no financial damages can result from its use.',
    },
    {
        title: '8. Responsible Gaming',
        body: 'While this App does not involve real money, it simulates gambling mechanics. If you or someone you know has a gambling problem: US: 1-800-522-4700 | UK: 0808-802-0133 | AU: 1800-858-858',
    },
    {
        title: '9. Modifications',
        body: 'The developer reserves the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the modified Terms.',
    },
];

// ─── Scrollable Section ───────────────────────────────────────────────────────

function ScrollableDocument({
    sections,
    label,
    icon: Icon,
    accentColor,
    onScrolledToBottom,
}: {
    sections: { title: string; body: string }[];
    label: string;
    icon: React.ElementType;
    accentColor: string;
    onScrolledToBottom: () => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [reached, setReached] = useState(false);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el || reached) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        if (atBottom) {
            setReached(true);
            onScrolledToBottom();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Icon size={18} style={{ color: accentColor }} />
                <span className="text-sm font-bold text-white/80">{label}</span>
                {reached && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto flex items-center gap-1 text-emerald-400 text-xs font-bold"
                    >
                        <CheckCircle size={14} />
                        Read
                    </motion.span>
                )}
            </div>

            {/* Scrollable content */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto pr-2 space-y-4 scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
            >
                {sections.map((s) => (
                    <div key={s.title}>
                        <p className="text-xs font-bold text-white/70 mb-1">{s.title}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{s.body}</p>
                    </div>
                ))}

                {/* Sentinel to ensure there's something to scroll to */}
                <div className="h-4" />
            </div>

            {/* Scroll hint */}
            {!reached && (
                <p className="text-center text-[10px] text-white/25 mt-2 flex-shrink-0 animate-pulse">
                    ↓ Scroll to the bottom to continue
                </p>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function LegalAgreementModal({ onAccepted }: { onAccepted: () => void }) {
    const [visible, setVisible] = useState(false);
    const [tab, setTab] = useState<'privacy' | 'terms'>('privacy');
    const [privacyRead, setPrivacyRead] = useState(false);
    const [termsRead, setTermsRead] = useState(false);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        hasAccepted().then((agreed) => {
            if (agreed) {
                onAccepted();
            } else {
                setVisible(true);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const bothRead = privacyRead && termsRead;

    const handleAccept = async () => {
        if (!bothRead) return;
        setAccepting(true);
        await persistAcceptance();
        setVisible(false);
        onAccepted();
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="legal-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ background: 'rgba(5, 10, 8, 0.97)' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-full max-w-2xl h-[80vh] max-h-[700px] flex flex-col rounded-2xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, #1a1208 0%, #0f0d07 100%)',
                            border: '1px solid rgba(212, 168, 67, 0.2)',
                            boxShadow: '0 0 80px rgba(212, 168, 67, 0.12)',
                        }}
                    >
                        {/* Title bar */}
                        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3 mb-1">
                                <AlertTriangle size={20} className="text-amber-400" />
                                <h2 className="text-lg font-black text-white">Before You Play</h2>
                            </div>
                            <p className="text-xs text-white/40">
                                Please read and accept our Privacy Policy and Terms of Service.
                                You only need to do this once.
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex-shrink-0 flex border-b border-white/10">
                            {(['privacy', 'terms'] as const).map((t) => {
                                const isRead = t === 'privacy' ? privacyRead : termsRead;
                                const isActive = tab === t;
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className="flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                                        style={{
                                            color: isActive ? '#d4a843' : 'rgba(255,255,255,0.3)',
                                            borderBottom: isActive ? '2px solid #d4a843' : '2px solid transparent',
                                        }}
                                    >
                                        {t === 'privacy'
                                            ? <><Shield size={13} /> Privacy Policy {isRead && <CheckCircle size={13} className="text-emerald-400" />}</>
                                            : <><FileText size={13} /> Terms of Service {isRead && <CheckCircle size={13} className="text-emerald-400" />}</>
                                        }
                                    </button>
                                );
                            })}
                        </div>

                        {/* Document content */}
                        <div className="flex-1 min-h-0 px-6 py-4 overflow-hidden">
                            {tab === 'privacy' ? (
                                <ScrollableDocument
                                    key="privacy"
                                    sections={PRIVACY_CONTENT}
                                    label="Privacy Policy — Last updated: 2026-03-04"
                                    icon={Shield}
                                    accentColor="#d4a843"
                                    onScrolledToBottom={() => setPrivacyRead(true)}
                                />
                            ) : (
                                <ScrollableDocument
                                    key="terms"
                                    sections={TERMS_CONTENT}
                                    label="Terms of Service — Last updated: 2026-03-04"
                                    icon={FileText}
                                    accentColor="#d4a843"
                                    onScrolledToBottom={() => setTermsRead(true)}
                                />
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-white/10 space-y-3">
                            {/* Progress indicator */}
                            <div className="flex items-center gap-3 text-xs text-white/30">
                                <div className="flex items-center gap-1.5">
                                    {privacyRead
                                        ? <CheckCircle size={13} className="text-emerald-400" />
                                        : <div className="w-3 h-3 rounded-full border border-white/20" />}
                                    <span className={privacyRead ? 'text-emerald-400' : ''}>Privacy Policy</span>
                                </div>
                                <span className="text-white/15">•</span>
                                <div className="flex items-center gap-1.5">
                                    {termsRead
                                        ? <CheckCircle size={13} className="text-emerald-400" />
                                        : <div className="w-3 h-3 rounded-full border border-white/20" />}
                                    <span className={termsRead ? 'text-emerald-400' : ''}>Terms of Service</span>
                                </div>
                                {!bothRead && (
                                    <span className="ml-auto text-white/20 italic">
                                        {!privacyRead && !termsRead
                                            ? 'Read both documents to continue'
                                            : !privacyRead
                                                ? 'Read Privacy Policy to continue'
                                                : 'Read Terms of Service to continue'}
                                    </span>
                                )}
                            </div>

                            {/* Accept button */}
                            <motion.button
                                onClick={handleAccept}
                                disabled={!bothRead || accepting}
                                className="w-full py-3 rounded-xl font-extrabold text-sm uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                                style={{
                                    background: bothRead
                                        ? 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)'
                                        : 'rgba(255,255,255,0.06)',
                                    color: bothRead ? '#000' : 'rgba(255,255,255,0.2)',
                                    boxShadow: bothRead ? '0 0 30px rgba(212,168,67,0.3)' : 'none',
                                }}
                                whileHover={bothRead ? { scale: 1.01 } : {}}
                                whileTap={bothRead ? { scale: 0.98 } : {}}
                            >
                                {accepting ? 'Saving...' : bothRead ? '✓ I Accept — Enter Game' : 'Read both documents above to continue'}
                            </motion.button>

                            <p className="text-center text-[10px] text-white/15">
                                18+ Simulated Gambling • No Real Money • For Entertainment & Education Only
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
