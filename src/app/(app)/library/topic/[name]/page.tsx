import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Target, Brain, BookOpen, Star, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { getTopicGuide } from '@/app/actions/library'

interface PageProps {
  params: Promise<{ name: string }>
}

export default async function TopicGuidePage({ params }: PageProps) {
  const { name } = await params
  const topicName = decodeURIComponent(name)
  const guide = await getTopicGuide(topicName)

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Topic Guide Under Construction</h2>
          <p className="text-slate-500 mb-8">We're currently perfecting the expert tips for this topic.</p>
          <Link href="/library" className="text-indigo-600 font-bold hover:underline italic">Back to Library</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 pt-20 pb-12 px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/library" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Library
          </Link>
          <div>
             <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest">Premium Guide</span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Expert Verified</span>
             </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">{topicName}</h1>
            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">{guide.overview}</p>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="grid gap-16">
          {guide.key_concepts.map((concept: any, i: number) => (
            <section 
              key={concept.title}
              className="relative pl-12"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-slate-100 rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">0{i+1}</span>
                {concept.title}
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">{concept.text}</p>
            </section>
          ))}

          {/* Pro Tip Box */}
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest mb-4">
                  <Star className="h-4 w-4 fill-current" />
                  Expert Tip
                </div>
                <p className="text-2xl font-bold leading-tight italic">"{guide.pro_tip}"</p>
             </div>
             <ShieldCheck className="absolute -right-10 -bottom-10 h-64 w-64 text-white/5 rotate-12" />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-8">Mastered the theory? Time to practice.</h3>
          <Link 
            href={`/practice/topic/${topicName}`}
            className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-200"
          >
            Start Topic Drill
            <Zap className="h-5 w-5 fill-current" />
          </Link>
        </div>
      </div>
    </div>
  )
}
