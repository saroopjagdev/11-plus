'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, Clock, ShieldCheck, Zap, Sparkles, BookOpen, Target } from 'lucide-react'
import Link from 'next/link'

export default function HandbookPage() {
  const sections = [
    {
      title: "Exam Day Psychology",
      icon: <Brain className="h-6 w-6 text-indigo-500" />,
      content: "The 11+ is as much a test of temperament as it is of intelligence. Encourage your child to view the exam as a 'challenge to show what they know' rather than a threat. Practicing box breathing (inhale for 4, hold for 4, exhale for 4) can lower heart rates instantly during the test."
    },
    {
      title: "The 'Skip & Return' Strategy",
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      content: "Time is the biggest enemy. Teach students that every question is worth the same mark. If a question takes more than 45 seconds, skip it, circle it, and move on. Return to it only after the rest of the paper is finished. This builds momentum and ensures they don't miss easy marks at the end."
    },
    {
      title: "MCQ Elimination Mastery",
      icon: <Target className="h-6 w-6 text-emerald-500" />,
      content: "In Multiple Choice papers, the answer is already on the page. Use the process of elimination to remove 'impossible' distractors. Even removing two wrong answers increases the chance of a correct guess from 20% to 50%."
    },
    {
      title: "Post-Exam Review",
      icon: <ShieldCheck className="h-6 w-6 text-violet-500" />,
      content: "Once the paper is done, it's done. Avoid 'post-mortem' discussions that cause anxiety. Focus on the effort made rather than the predicted result. A positive mindset between papers is crucial for multi-day exam schedules."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-20 pb-32 px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/library" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Library
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl font-black mb-6 tracking-tight">The 11+ Exam <span className="text-indigo-400">Success Handbook</span></h1>
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">Everything you need to know about exam-day strategy, mindset, and performance optimization for students and parents.</p>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/10 to-transparent" />
        <BookOpen className="absolute -right-20 -bottom-20 h-96 w-96 text-white/5 rotate-12" />
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-8 -mt-16 relative z-20">
        <div className="grid gap-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 group"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-4">{section.title}</h2>
                  <p className="text-slate-600 leading-relaxed text-lg">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 mb-20 p-12 bg-indigo-600 rounded-[3rem] text-white text-center shadow-2xl shadow-indigo-200">
          <Sparkles className="h-12 w-12 mx-auto mb-6 text-indigo-300" />
          <h3 className="text-3xl font-black mb-4">Ready to put this into practice?</h3>
          <p className="text-indigo-100 mb-8 max-w-md mx-auto">Start a timed mock exam to build your stamina and test your new strategies.</p>
          <Link href="/practice/mock/Maths" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl">
            Start Mock Exam
            <Zap className="h-5 w-5 fill-current" />
          </Link>
        </div>
      </div>
    </div>
  )
}
