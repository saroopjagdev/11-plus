import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-12 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="h-16 w-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-8">
            <FileText className="h-8 w-8 text-violet-600" />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 font-bold mb-12">Last Updated: May 2025</p>
          
          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-500 leading-relaxed">
                By accessing or using Ace 11+, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">2. Subscription & Payments</h2>
              <p className="text-slate-500 leading-relaxed">
                Ace 11+ Pro is a subscription-based service. You agree to pay the fees associated with your chosen plan. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. All payments are processed via Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">3. Use of AI Tutor</h2>
              <p className="text-slate-500 leading-relaxed">
                Our AI tutor is designed to provide educational guidance. While we strive for 100% accuracy, AI models may occasionally produce incorrect results. Ace 11+ is a tool to supplement learning and does not guarantee specific exam results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">4. Intellectual Property</h2>
              <p className="text-slate-500 leading-relaxed">
                All content on Ace 11+, including questions, explanations, and code, is the property of Ace 11+ Intelligence and is protected by copyright laws. You may not reproduce or distribute our content without explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-slate-500 leading-relaxed">
                Ace 11+ is provided "as is". We are not liable for any damages arising from your use of the platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
