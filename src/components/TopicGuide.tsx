'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, AlertCircle, Trophy, Lightbulb } from 'lucide-react'
import Link from 'next/link'

interface TopicGuideProps {
  title: string
  content: string
  practiceHref?: string
}

export function TopicGuide({ title, content, practiceHref }: TopicGuideProps) {
  return (
    <motion.article 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden"
    >
      {/* Hero Header */}
      <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-6">
               <BookOpen className="h-4 w-4 fill-current" />
               Study Guide
            </div>
            <h1 className="text-5xl font-black tracking-tight">{title}</h1>
         </div>
         {/* Decorative */}
         <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500/20 rounded-full blur-[80px]" />
         <Sparkles className="absolute top-10 right-10 h-10 w-10 text-indigo-400/30" />
      </div>

      {/* Content Area */}
      <div className="p-12 lg:p-20">
         <div className="prose prose-slate prose-lg max-w-none 
           prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
           prose-p:text-slate-500 prose-p:leading-relaxed prose-p:font-medium
           prose-strong:text-slate-900 prose-strong:font-black
           prose-li:text-slate-500 prose-li:font-medium
         ">
            <ReactMarkdown
              components={{
                h2: ({node, ...props}) => (
                  <h2 {...props} className="text-3xl mt-16 mb-8 flex items-center gap-3">
                     <span className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                     {props.children}
                  </h2>
                ),
                strong: ({node, ...props}) => {
                  const content = String(props.children)
                  if (content.includes('11+ Secret')) {
                     return (
                        <div className="my-10 p-8 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-100 relative overflow-hidden group">
                           <div className="flex items-center gap-3 mb-4 font-black uppercase text-xs tracking-widest text-indigo-200">
                              <Lightbulb className="h-5 w-5 text-white" />
                              The 11+ Pro Secret
                           </div>
                           <span className="text-xl font-bold relative z-10 leading-relaxed italic">{props.children}</span>
                           <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
                        </div>
                     )
                  }
                  if (content.includes('Common Traps')) {
                     return (
                        <div className="my-10 p-8 bg-rose-50 border-2 border-rose-100 rounded-[2rem] text-rose-900">
                           <div className="flex items-center gap-3 mb-4 font-black uppercase text-xs tracking-widest text-rose-400">
                              <AlertCircle className="h-5 w-5" />
                              Common Trap Alert
                           </div>
                           <span className="text-lg font-bold leading-relaxed">{props.children}</span>
                        </div>
                     )
                  }
                  return <strong {...props} />
                },
                blockquote: ({node, ...props}) => (
                   <blockquote className="border-l-8 border-indigo-100 pl-8 italic text-2xl text-slate-400 font-bold my-12">
                      {props.children}
                   </blockquote>
                )
              }}
            >
              {content}
            </ReactMarkdown>
         </div>

         {/* Review Footer */}
         <div className="mt-20 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Trophy className="h-6 w-6" />
               </div>
               <div>
                  <p className="font-bold text-slate-900">Ready to test yourself?</p>
                  <p className="text-sm text-slate-400 font-medium">Put what you just learned into practice.</p>
               </div>
            </div>
            <Link 
              href={practiceHref || '/dashboard#hubs'}
              className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
               Take Practice Quiz
            </Link>
         </div>
      </div>
    </motion.article>
  )
}
