import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Zap,
  MapPin,
  Shield,
  Eye,
  Heart,
  Clock,
  Lock,
  Users,
  Sparkles,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import FeatureCard from '../components/FeatureCard'
import PhoneMockup from '../components/PhoneMockup'
import IntentButton from '../components/IntentButton'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-spur-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-spur-pink/10 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block px-4 py-1.5 rounded-full bg-spur-purple/10 border border-spur-purple/30 text-spur-purple text-xs font-medium mb-6">
                  Real-time. Mutual. Instant.
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              >
                Desire.{' '}
                <span className="gradient-text">Consent.</span>
                <br />
                Connection{' '}
                <span className="gradient-text">Instantly.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-spur-muted max-w-xl mb-8 mx-auto lg:mx-0"
              >
                Spur matches you with nearby people who want the same thing, right now. 
                No swiping. No waiting. Just real-time, mutual intent.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to="/onboarding"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold text-lg hover:opacity-90 transition-opacity glow-purple"
                >
                  Get Early Access
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 rounded-full border border-spur-border text-white font-semibold text-lg hover:bg-spur-card transition-colors"
                >
                  See How It Works
                </a>
              </motion.div>
            </div>

            {/* Right: Phone mockup */}
            <div className="flex-1 flex justify-center">
              <PhoneMockup>
                <div className="h-full bg-gradient-to-b from-spur-dark to-spur-darker flex flex-col items-center justify-center px-6">
                  <p className="text-spur-muted text-xs mb-2">Your intent is</p>
                  <p className="text-white font-semibold text-sm mb-8">Open to Connection</p>
                  <IntentButton size="md" />
                  <p className="text-spur-muted text-xs mt-8">3 people nearby share your intent</p>
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              One tap. <span className="gradient-text">Mutual intent.</span> Instant match.
            </h2>
            <p className="text-spur-muted text-lg max-w-2xl mx-auto">
              No algorithms guessing what you want. You tell Spur your intent, and when someone nearby shares it — connection happens.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Set Your Intent',
                description: 'Tap the intent button and choose what you are open to right now. Casual, romantic, or just vibes.',
                icon: <Zap className="text-spur-purple" size={24} />,
              },
              {
                step: '02',
                title: 'Nearby Match',
                description: 'Spur scans your immediate radius. When someone shares your intent, both of you are notified simultaneously.',
                icon: <MapPin className="text-spur-pink" size={24} />,
              },
              {
                step: '03',
                title: 'Connect Instantly',
                description: 'Mutual consent confirmed. Start chatting, share a moment, or meet up — all on your terms.',
                icon: <Heart className="text-spur-purple" size={24} />,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-2xl bg-spur-card border border-spur-border/50 text-center"
              >
                <span className="absolute top-4 right-4 text-5xl font-bold text-spur-border/30">
                  {item.step}
                </span>
                <div className="w-14 h-14 rounded-full bg-spur-dark flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-spur-muted text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-spur-dark/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Six pillars of <span className="gradient-text">Spur</span>
            </h2>
            <p className="text-spur-muted text-lg max-w-2xl mx-auto">
              Every feature is designed around consent, privacy, and the urgency of the moment.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="text-spur-purple" size={24} />}
              title="Instant Intent Mode"
              description="One tap activates a real-time mood signal. Choose from intents like Open to Intimacy, Looking to Hook Up, Casual Connection, or Romantic."
              delay={0}
            />
            <FeatureCard
              icon={<MapPin className="text-spur-pink" size={24} />}
              title="Ultra-Local Matching"
              description="Connect within the same building, event, bar, or campus. Location is always approximate — never exact coordinates."
              delay={0.1}
            />
            <FeatureCard
              icon={<Sparkles className="text-spur-purple" size={24} />}
              title="Hookup Mode"
              description="A dedicated space for casual encounters. Specify your vibe, time window, and boundaries upfront. No pressure."
              delay={0.2}
            />
            <FeatureCard
              icon={<Heart className="text-spur-pink" size={24} />}
              title="Relationship Mode"
              description="Seeking something longer-term? Activate compatibility filtering with personality tags, preference matching, and scoring."
              delay={0.3}
            />
            <FeatureCard
              icon={<Eye className="text-spur-purple" size={24} />}
              title="Privacy by Design"
              description="No public profiles. No 'last seen' status. Optional blurred photos. Auto-clearing chat history. Your privacy is the default."
              delay={0.4}
            />
            <FeatureCard
              icon={<Shield className="text-spur-pink" size={24} />}
              title="Safety Layer"
              description="Verified onboarding, AI-driven bot detection, in-chat panic button, optional ID verification. Safety is mandatory, not optional."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                The safest adult-intent platform. <span className="gradient-text">Period.</span>
              </h2>
              <p className="text-spur-muted text-lg mb-8">
                Consent is built into the core mechanic, not bolted on as an afterthought. 
                Every interaction is backed by multiple layers of protection.
              </p>

              <div className="space-y-4">
                {[
                  { icon: <Shield size={20} />, text: 'Verified profile onboarding' },
                  { icon: <Lock size={20} />, text: 'AI-driven fake account & bot detection' },
                  { icon: <Zap size={20} />, text: 'In-chat panic button with one-tap exit' },
                  { icon: <Users size={20} />, text: 'Optional ID verification for premium' },
                  { icon: <Clock size={20} />, text: 'Community standards centred on consent' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-spur-purple/20 flex items-center justify-center text-spur-purple">
                      {item.icon}
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="flex-1 flex justify-center">
              <PhoneMockup>
                <div className="h-full bg-gradient-to-b from-spur-dark to-spur-darker flex flex-col items-center justify-center px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <Shield className="text-green-400" size={32} />
                  </div>
                  <p className="text-white font-semibold mb-2">You are protected</p>
                  <p className="text-spur-muted text-xs mb-6">All safety features are active</p>
                  <div className="w-full space-y-3">
                    {['Identity verified', 'Location approximate', 'Chat auto-clears'].map((t) => (
                      <div key={t} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spur-card border border-spur-border/50">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-spur-text">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 px-6 bg-spur-dark/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              A new category, <span className="gradient-text">not a new competitor</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-spur-border">
                  <th className="text-left py-4 px-4 text-spur-muted font-medium"></th>
                  <th className="py-4 px-4 text-spur-muted font-medium">Tinder/Bumble</th>
                  <th className="py-4 px-4 text-spur-muted font-medium">Grindr/Scruff</th>
                  <th className="py-4 px-4 font-bold text-white bg-spur-purple/10 rounded-t-xl">Spur</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Match speed', 'Days-weeks', 'Hours-days', 'Seconds'],
                  ['Intent clarity', 'Ambiguous', 'Partial', 'Explicit & mutual'],
                  ['Real-time matching', '✗', '✗', '✓'],
                  ['Privacy first', 'Partial', 'Partial', 'Full'],
                  ['Consent layer', 'Implied', 'Implied', 'Built-in'],
                  ['Audience', 'Broad', 'LGBTQ+', 'All adults'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-spur-border/30">
                    <td className="py-3 px-4 text-white font-medium">{row[0]}</td>
                    <td className="py-3 px-4 text-center text-spur-muted">{row[1]}</td>
                    <td className="py-3 px-4 text-center text-spur-muted">{row[2]}</td>
                    <td className="py-3 px-4 text-center font-semibold text-white bg-spur-purple/5">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl bg-gradient-to-br from-spur-purple/20 to-spur-pink/20 border border-spur-border"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to feel the <span className="gradient-text">Spur</span>?
            </h2>
            <p className="text-spur-muted text-lg mb-8 max-w-xl mx-auto">
              Join the waitlist for early access. Be among the first to experience connection without compromise.
            </p>
            <Link
              to="/onboarding"
              className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold text-lg hover:opacity-90 transition-opacity glow-purple"
            >
              Join the Waitlist
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-spur-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink" />
            <span className="font-bold">Spur</span>
          </div>
          <p className="text-spur-muted text-sm">
            Desire. Consent. Connection. Instantly.
          </p>
          <p className="text-spur-muted text-xs">
            &copy; {new Date().getFullYear()} Spur. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
