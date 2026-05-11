'use client'

import React, { useState } from 'react'
import { Search, FileText, ChevronRight, Zap, Target, Brain } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Topic {
  name: string
  level: string
  readTime: string
  boards: string[]
}

interface Category {
  title: string
  icon: React.ReactNode
  color: string
  topics: Topic[]
}

interface LibrarySearchProps {
  categories: Category[]
  targetExams: string[]
}

export function LibrarySearch({ categories, targetExams }: LibrarySearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = categories.map(cat => ({
    ...cat,
    topics: cat.topics.filter(topic => 
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.topics.length > 0)

  return (
    <div className="space-y-12">
      {/* Search Bar */}
      <div className="relative mb-16">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
        <input 
          type="text" 
          placeholder="Search for a topic (e.g. 'Fractions')" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-[2rem] py-6 pl-14 pr-8 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium text-lg shadow-sm text-slate-900 placeholder:text-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <AnimatePresence mode="popLayout">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={category.title} 
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className={`${category.color} p-3 rounded-2xl`}>
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{category.title}</h2>
                </div>

                <div className="space-y-4">
                  {category.topics.map((topic) => {
                    const isTargeted = targetExams.some(te => 
                      topic.boards.some(b => te.toLowerCase().includes(b.toLowerCase()))
                    )
                    
                    return (
                      <Link 
                        key={topic.name} 
                        href={`/library/topic/${encodeURIComponent(topic.name)}`}
                        className="block p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
                      >
                        {isTargeted && (
                          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1">
                            <Target className="h-2 w-2" />
                            Targeted
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{topic.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{topic.level}</span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{topic.readTime}</span>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
               <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-slate-200" />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-2">No results found</h3>
               <p className="text-slate-400">Try searching for something else, or browse the categories.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
