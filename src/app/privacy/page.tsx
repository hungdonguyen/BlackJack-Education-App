'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { useModalNavigation } from '@/hooks/useMenuNavigation';

export default function PrivacyPage() {
    const router = useRouter();
    const lastUpdated = '2026-04-03';

    useModalNavigation({
        onClose: () => router.back(),
    });

    return (
        <div
            className="h-full w-full overflow-y-auto"
            style={{
                background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
            }}
        >
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-8 cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        <span className="text-sm">Back</span>
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="text-amber-400" size={28} />
                        <h1
                            className="text-3xl font-black text-transparent bg-clip-text"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)',
                            }}
                        >
                            Privacy Policy
                        </h1>
                    </div>
                    <p className="text-white/30 text-sm">Last updated: {lastUpdated}</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8 text-white/60 text-sm leading-relaxed"
                >
                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">1. Introduction</h2>
                        <p>
                            Educational Blackjack (&quot;the App&quot;) is a free educational card game application.
                            Core gameplay runs locally and can be played offline. We are committed to
                            protecting your privacy. This Privacy Policy explains what data the App does
                            — and does not — collect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">2. Data Collection</h2>
                        <p className="mb-3">
                            <strong className="text-emerald-400">We collect absolutely no personal data.</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The App does <strong className="text-white/80">not send personal account or gameplay data</strong> to developer-operated servers.</li>
                            <li>No analytics, tracking, or telemetry initiated by the App.</li>
                            <li>No cookies or web beacons.</li>
                            <li>No in-app user accounts, registration, or authentication.</li>
                            <li>No advertising or ad-related data collection.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">3. Storage by Platform</h2>
                        <p>
                            The App stores gameplay data <strong className="text-white/80">locally on your device only</strong>.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong className="text-white/80">Web build:</strong> browser <strong className="text-white/80">localStorage</strong> (key: blackjack-storage).</li>
                            <li><strong className="text-white/80">Tauri desktop build:</strong> local files such as <strong className="text-white/80">save.json</strong>, <strong className="text-white/80">history.json</strong>, and <strong className="text-white/80">simulator_history.json</strong>.</li>
                            <li><strong className="text-white/80">Virtual bankroll balance</strong> — your in-game virtual currency (no real monetary value).</li>
                            <li><strong className="text-white/80">Game history</strong> — records of past game rounds for educational review.</li>
                            <li><strong className="text-white/80">Daily claim status</strong> — timestamp of last free chip claim.</li>
                        </ul>
                        <p className="mt-3">
                            This data stays on your device unless you back up, sync, or share files
                            yourself. You can delete this data at any time by clearing browser storage,
                            uninstalling the application, or manually deleting local files.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">4. Third-Party Assets &amp; Platform Services</h2>
                        <p>
                            The App may load a limited number of <strong className="text-white/80">static visual assets</strong>
                            (for example, icons or texture patterns) from third-party CDNs. These requests
                            are asset-delivery requests and are not used by us for behavioral tracking.
                            Third-party providers may process technical network metadata (such as IP address
                            and user-agent) under their own policies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">5. Steam Distribution</h2>
                        <p>
                            At this time, the game is distributed on <strong className="text-white/80">Steam</strong>.
                            Steam account, platform, and payment-related data are handled by Valve under
                            Steam&apos;s own terms and privacy policy. The App does not request your Steam
                            credentials.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">6. GDPR Compliance (EU)</h2>
                        <p>
                            We do not collect or profile personal data for analytics or advertising. If
                            technical metadata is processed by third-party asset hosts or Steam, that
                            processing is governed by those providers&apos; own policies and legal bases.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">7. CCPA Compliance (California, US)</h2>
                        <p>
                            The App does not collect, sell, or share any personal information as defined
                            by the California Consumer Privacy Act (CCPA) for our own analytics or
                            advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">8. Children&apos;s Privacy</h2>
                        <p>
                            This App simulates gambling mechanics for educational purposes and is intended
                            for users aged 18 and above. It does not knowingly collect any data from
                            children or any other users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">9. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Any changes will be
                            reflected in the &quot;Last updated&quot; date at the top of this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">10. Audio Credits</h2>
                        <p>
                            Sound effects are sourced from Kenney.nl (CC0 Public Domain). Background
                            music is provided by Kevin MacLeod (incompetech.com) and Audionautix
                            (audionautix.com), licensed under Creative Commons: By Attribution 4.0
                            License (creativecommons.org/licenses/by/4.0).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">11. Contact</h2>
                        <p>
                            If you have questions about this Privacy Policy, please open an issue on the
                            project&apos;s repository or contact the developer.
                        </p>
                    </section>

                    {/* Footer */}
                    <div className="pt-8 border-t border-white/10 text-center text-white/20 text-xs">
                        <p>Educational Blackjack — For Entertainment &amp; Education Only</p>
                        <p className="mt-1">No real money • No in-app tracking • 18+ Simulated Gambling</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

