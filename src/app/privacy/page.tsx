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
          <p className="text-slate-400 font-bold mb-12">Last Updated: May 2025</p>
          
          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">1. Information We Collect</h2>
              <p className="text-slate-500 leading-relaxed">
                We collect information you provide directly to us when you create an account, such as your name, email address, and payment information. We also collect data about your child's progress and performance on the platform to provide personalized learning insights.
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
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">3. Data Security</h2>
              <p className="text-slate-500 leading-relaxed">
                We take the security of your and your child's data very seriously. We use industry-standard encryption and security practices to protect your information. Your payment data is handled securely by Stripe and never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">4. Contact Us</h2>
              <p className="text-slate-500 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at support@ace11plus.co.uk.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
