'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
                        <FileText className="text-amber-400" size={28} />
                        <h1
                            className="text-3xl font-black text-transparent bg-clip-text"
                            style={{
                                backgroundImage: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)',
                            }}
                        >
                            Terms of Service
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
                        <h2 className="text-lg font-bold text-white/90 mb-3">1. Acceptance of Terms</h2>
                        <p>
                            By downloading, installing, or using Educational Blackjack (&quot;the App&quot;),
                            you agree to be bound by these Terms of Service. If you do not agree to
                            these terms, do not use the App.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">2. Nature of the Application</h2>
                        <p className="mb-3">
                            <strong className="text-amber-400">This App is strictly for educational and entertainment purposes.</strong>
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The App simulates Blackjack card game mechanics for learning purposes.</li>
                            <li>
                                <strong className="text-white/80">No real money</strong> is involved at any stage — all currency within the
                                App is virtual and has absolutely no monetary value.
                            </li>
                            <li>The App cannot be used for real-money gambling.</li>
                            <li>Virtual chips cannot be exchanged, transferred, or redeemed for real currency, goods, or services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">3. Age Restriction</h2>
                        <p>
                            This App contains <strong className="text-amber-400">simulated gambling content (18+)</strong>.
                            By using this App, you confirm that you are at least 18 years of age or the
                            age of majority in your jurisdiction, whichever is higher. The App is not
                            intended for use by minors.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">4. Fair Play &amp; Randomness</h2>
                        <p>
                            The App uses a <strong className="text-white/80">Cryptographically Secure Pseudo-Random Number Generator
                                (CSPRNG)</strong> via the Web Crypto API (<code className="text-amber-400/80 bg-white/5 px-1 rounded">crypto.getRandomValues()</code>)
                            for all card shuffling operations. This ensures that card outcomes are
                            statistically unbiased and cannot be predicted or manipulated.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">5. Intellectual Property</h2>
                        <p>
                            The App&apos;s source code, design, and original assets are the intellectual
                            property of the developer. Standard playing card designs and Blackjack game
                            rules are in the public domain and are not claimed as proprietary.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">6. Disclaimer of Warranties</h2>
                        <p>
                            The App is provided <strong className="text-white/80">&quot;AS IS&quot;</strong> without warranty of any kind,
                            express or implied, including but not limited to the warranties of
                            merchantability, fitness for a particular purpose, and non-infringement.
                            The developer does not warrant that the App will be error-free or
                            uninterrupted.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">7. Limitation of Liability</h2>
                        <p>
                            In no event shall the developer be liable for any direct, indirect,
                            incidental, special, consequential, or punitive damages arising out of
                            or relating to the use of the App. Since the App involves no real money,
                            no financial damages can result from its use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">8. Responsible Gaming Notice</h2>
                        <p>
                            While this App does not involve real money, it simulates gambling mechanics.
                            If you or someone you know has a gambling problem, please contact a gambling
                            helpline in your country:
                        </p>
                        <ul className="list-disc pl-6 space-y-1 mt-3">
                            <li>US: National Problem Gambling Helpline — 1-800-522-4700</li>
                            <li>UK: GamCare — 0808-8020-133</li>
                            <li>AU: Gambling Help Online — 1800-858-858</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">9. Modifications</h2>
                        <p>
                            The developer reserves the right to modify these Terms at any time. Continued
                            use of the App after changes constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-bold text-white/90 mb-3">10. Contact</h2>
                        <p>
                            For questions about these Terms of Service, please open an issue on the
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
