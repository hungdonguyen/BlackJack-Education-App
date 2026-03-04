'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
    const router = useRouter();
    const lastUpdated = '2026-03-04';

    return (
        <div
            className="min-h-screen w-full select-none"
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
                            Educational Blackjack (&quot;the App&quot;) is a free, offline educational card game
                            application. We are committed to protecting your privacy. This Privacy Policy
                            explains what data the App does — and does not — collect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">2. Data Collection</h2>
                        <p className="mb-3">
                            <strong className="text-emerald-400">We collect absolutely no personal data.</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The App operates <strong className="text-white/80">100% offline</strong> — it makes no network requests whatsoever.</li>
                            <li>No analytics, tracking, or telemetry of any kind.</li>
                            <li>No cookies or web beacons.</li>
                            <li>No user accounts, registration, or authentication.</li>
                            <li>No advertising or ad-related data collection.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">3. Local Storage</h2>
                        <p>
                            The App stores the following data <strong className="text-white/80">locally on your device only</strong>:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-3">
                            <li><strong className="text-white/80">Virtual bankroll balance</strong> — your in-game virtual currency (no real monetary value).</li>
                            <li><strong className="text-white/80">Game history</strong> — records of past game rounds for educational review.</li>
                            <li><strong className="text-white/80">Daily claim status</strong> — timestamp of last free chip claim.</li>
                        </ul>
                        <p className="mt-3">
                            This data is stored in your operating system&apos;s application data directory
                            and <strong className="text-white/80">never leaves your device</strong>. You can delete this data at any time
                            by uninstalling the application or manually deleting the files.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">4. Third-Party Services</h2>
                        <p>
                            The App uses <strong className="text-white/80">no third-party services</strong>, APIs, SDKs, or
                            external libraries that collect, process, or transmit user data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">5. GDPR Compliance (EU)</h2>
                        <p>
                            Since the App collects no personal data and processes no information about
                            identifiable individuals, the provisions of the General Data Protection
                            Regulation (GDPR) do not impose specific obligations. No consent mechanism
                            is required because there is nothing to consent to.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">6. CCPA Compliance (California, US)</h2>
                        <p>
                            The App does not collect, sell, or share any personal information as defined
                            by the California Consumer Privacy Act (CCPA). There is no personal
                            information to disclose, delete, or opt out from selling.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">7. Children&apos;s Privacy</h2>
                        <p>
                            This App simulates gambling mechanics for educational purposes and is intended
                            for users aged 18 and above. It does not knowingly collect any data from
                            children or any other users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">8. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Any changes will be
                            reflected in the &quot;Last updated&quot; date at the top of this page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">9. Contact</h2>
                        <p>
                            If you have questions about this Privacy Policy, please open an issue on the
                            project&apos;s repository or contact the developer.
                        </p>
                    </section>

                    {/* Footer */}
                    <div className="pt-8 border-t border-white/10 text-center text-white/20 text-xs">
                        <p>Educational Blackjack — For Entertainment &amp; Education Only</p>
                        <p className="mt-1">No real money • No data collection • 18+ Simulated Gambling</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
