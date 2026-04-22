import { createClient } from '@/lib/supabase/server'
import { AVATAR_COLLECTION } from '@/lib/constants/avatars'
import { Trophy, Flame, Play, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // 1. Fetch Top 10 by Points
  const { data: topPoints } = await supabase
    .from('children')
    .select('id, name, total_points, xp, level, avatar_url, current_streak')
    .order('total_points', { ascending: false })
    .limit(10)

  // 2. Fetch Top 10 by Streak
  const { data: topStreaks } = await supabase
    .from('children')
    .select('id, name, total_points, xp, level, avatar_url, current_streak')
    .order('current_streak', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-2">Global Leaderboard</h1>
        <p className="text-slate-500 font-medium">See how you compare with other 11+ explorers!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Points Leaderboard */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-indigo-50/50">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                   <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Score Masters</h2>
             </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Points</span>
          </div>

          <div className="space-y-4">
            {topPoints?.map((child, index) => {
              const avatar = AVATAR_COLLECTION.find(a => a.id === child.avatar_url)
              return (
                <div 
                  key={child.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                    index === 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-black text-slate-400">
                      {index + 1}
                    </div>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${avatar?.bgColor || 'bg-indigo-100'}`}>
                      {avatar?.emoji || child.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{child.name}</p>
                      <p className="text-[10px] font-black text-indigo-500 uppercase">Level {child.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 leading-none">{child.total_points}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Points</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Streak Leaderboard */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-indigo-50/50">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center">
                   <Flame className="h-6 w-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Consistency Chiefs</h2>
             </div>
             <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Streak</span>
          </div>

          <div className="space-y-4">
            {topStreaks?.map((child, index) => {
              const avatar = AVATAR_COLLECTION.find(a => a.id === child.avatar_url)
              return (
                <div 
                  key={child.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                    index === 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-black text-slate-400">
                      {index + 1}
                    </div>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${avatar?.bgColor || 'bg-indigo-100'}`}>
                      {avatar?.emoji || child.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{child.name}</p>
                      <p className="text-[10px] font-black text-rose-500 uppercase">Daily Grind</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 leading-none">{child.current_streak}d</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Streak</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Encouragement Footer */}
      <footer className="mt-16 bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="max-w-md">
              <h3 className="text-3xl font-black mb-4">Climb the Ranks!</h3>
              <p className="text-slate-400 font-medium">Every practice session helps you level up and reach the top. Consistency is the key to 11+ success.</p>
           </div>
           <Link 
            href="/dashboard"
            className="px-10 py-5 bg-indigo-600 rounded-2xl font-black text-lg hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/20"
           >
              <Play className="h-5 w-5 fill-current" />
              Start My Next Session
           </Link>
        </div>
        {/* Background Sparkles */}
        <div className="absolute top-0 right-0 p-8 opacity-20">
           <Star className="h-40 w-40 text-amber-400 fill-current" />
        </div>
      </footer>
    </div>
  )
}
