import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-12 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 font-bold mb-12">Last Updated: August 2026</p>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">1. Information We Collect</h2>
              <p className="text-slate-500 leading-relaxed">
                We collect information you provide directly to us when you create an account, such as your name, email address, and payment information. We also collect data about your child&apos;s progress and performance on the platform — answers, scores, time spent, and topic-level strengths and weaknesses — to provide personalized learning insights.
              </p>
              <p className="text-slate-500 leading-relaxed mt-4">
                We also collect a small amount of information automatically when you visit our website: anonymized pageview and usage analytics (via Vercel Analytics), and — where you arrive from a marketing link — first-touch attribution data (see &quot;Cookies and Tracking&quot; below).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-500 leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-slate-500 space-y-2 mt-4">
                <li>Provide and maintain the Ace 11+ platform.</li>
                <li>Personalize the learning experience for students.</li>
                <li>Process payments and subscriptions via Stripe.</li>
                <li>Send technical notices, updates, and support messages.</li>
                <li>Analyze trends and usage to improve our AI tutor.</li>
                <li>Understand which marketing channels bring families to Ace 11+, so we can improve our content and outreach.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">3. Third-Party Services We Use</h2>
              <p className="text-slate-500 leading-relaxed">
                Ace 11+ is built on a small number of trusted third-party services, each of which processes a limited slice of your data solely to provide their part of the platform:
              </p>
              <ul className="list-disc pl-6 text-slate-500 space-y-2 mt-4">
                <li><strong className="text-slate-700">Stripe</strong> — processes payments and manages subscriptions. We never see or store your full card details.</li>
                <li><strong className="text-slate-700">Supabase</strong> — hosts our database and handles account authentication, storing your account details and your child&apos;s learning data securely.</li>
                <li><strong className="text-slate-700">OpenAI</strong> — powers our AI tutor&apos;s explanations and helps generate some of our email content. Relevant question/answer context may be sent to OpenAI to generate a response, but it is not used by OpenAI to train their models.</li>
                <li><strong className="text-slate-700">Resend</strong> — delivers our transactional emails (receipts, password resets, progress updates) and, where you&apos;ve opted in, marketing emails.</li>
                <li><strong className="text-slate-700">Vercel Analytics</strong> — provides anonymized, aggregate pageview analytics for our website. It does not use cookies or track individuals across sites.</li>
                <li><strong className="text-slate-700">Meta / Facebook Graph API</strong> — used only for our own outbound social media posting (see &quot;Our Social Media Accounts&quot; below). It does not collect any data from visitors to our site.</li>
              </ul>
              <p className="text-slate-500 leading-relaxed mt-4">
                We choose providers who meet a high bar for security and, where applicable, are themselves GDPR-compliant. We do not sell your data to any of these providers or anyone else.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">4. Cookies and Tracking</h2>
              <p className="text-slate-500 leading-relaxed">
                We keep tracking to a minimum. Ace 11+ uses a single first-party cookie, <code className="text-sm bg-slate-100 rounded px-1.5 py-0.5">ace_attribution</code>, to remember how a visitor first found us — for example, which marketing campaign or link they arrived from. It captures only campaign parameters (UTM values) and, where present, the referring website&apos;s domain.
              </p>
              <ul className="list-disc pl-6 text-slate-500 space-y-2 mt-4">
                <li>It is set on your first visit only and is never overwritten by a later visit, so credit always goes to the original source that brought you here.</li>
                <li>It expires automatically after 30 days.</li>
                <li>It is strictly first-party: it is never shared with ad networks, data brokers, or any third party, and is not used to track you across other websites.</li>
                <li>It contains no personal information beyond the campaign/referrer values described above.</li>
              </ul>
              <p className="text-slate-500 leading-relaxed mt-4">
                We also use Vercel Analytics, which measures aggregate site traffic without setting tracking cookies or building an individual profile of you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">5. Children&apos;s Data</h2>
              <p className="text-slate-500 leading-relaxed">
                Ace 11+ is designed for children aged approximately 7 to 11 preparing for the 11+ exam. We take our responsibility around children&apos;s data seriously, in line with UK GDPR and the ICO&apos;s Age Appropriate Design Code.
              </p>
              <ul className="list-disc pl-6 text-slate-500 space-y-2 mt-4">
                <li>Every account is created and controlled by a parent or guardian. We do not allow children to sign up independently.</li>
                <li>We do not knowingly collect personal information directly from a child under 13 without that involvement — account credentials, payment details, and contact information belong to the parent, not the child.</li>
                <li>Data generated by the child&apos;s platform use (answers, scores, progress) is visible to the parent account and used solely to power their child&apos;s learning experience.</li>
                <li>A parent can request a full export or deletion of their child&apos;s data at any time by emailing <a href="mailto:support@ace11plus.org" className="text-indigo-600 hover:underline">support@ace11plus.org</a>. We will act on deletion requests promptly, subject only to what we&apos;re legally required to retain (e.g. billing records).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">6. Data Retention</h2>
              <p className="text-slate-500 leading-relaxed">
                We retain your account and learning data for as long as your account remains active, so the platform can keep providing an accurate, personalized experience. If you close your account or request deletion, we delete or anonymize your personal data within a reasonable period, except where we&apos;re required to retain certain records (such as payment and billing history) to meet our legal and tax obligations. The <code className="text-sm bg-slate-100 rounded px-1.5 py-0.5">ace_attribution</code> cookie described above expires automatically after 30 days regardless of account status.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">7. Your Rights</h2>
              <p className="text-slate-500 leading-relaxed">
                Under UK GDPR, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-slate-500 space-y-2 mt-4">
                <li><strong className="text-slate-700">Access</strong> — ask us for a copy of the personal data we hold about you or your child.</li>
                <li><strong className="text-slate-700">Correction</strong> — ask us to fix any information that&apos;s inaccurate or incomplete.</li>
                <li><strong className="text-slate-700">Deletion</strong> — ask us to delete your account and personal data.</li>
                <li><strong className="text-slate-700">Export</strong> — request your data in a portable, commonly used format.</li>
                <li><strong className="text-slate-700">Objection</strong> — object to certain uses of your data, such as marketing emails, at any time.</li>
              </ul>
              <p className="text-slate-500 leading-relaxed mt-4">
                To exercise any of these rights, just email us at <a href="mailto:support@ace11plus.org" className="text-indigo-600 hover:underline">support@ace11plus.org</a> — no need for formal legal language, we&apos;re happy to help directly. If you&apos;re ever unsatisfied with how we&apos;ve handled a request, you also have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">8. Our Social Media Accounts</h2>
              <p className="text-slate-500 leading-relaxed">
                Ace 11+ maintains its own accounts on Instagram, Facebook, YouTube, and (soon) TikTok, where we publish original educational content — short practice tips and vocabulary videos for the 11+ exam. This is outbound content publishing to our own business accounts only: it does not involve collecting or processing any personal data from visitors, followers, or users of those platforms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">9. Data Security</h2>
              <p className="text-slate-500 leading-relaxed">
                We take the security of your and your child&apos;s data very seriously. We use industry-standard encryption and security practices to protect your information. Your payment data is handled securely by Stripe and never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">10. Contact Us</h2>
              <p className="text-slate-500 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at support@ace11plus.org.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
