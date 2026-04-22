import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, Trophy, Gift, ArrowRight, Settings, Users, LineChart, Target } from 'lucide-react'
import Link from 'next/link'

export default async function ParentHubPage() {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Profile & Children
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: children } = await supabase.from('children').select('*').eq('parent_id', user.id)

  if (!children || children.length === 0) redirect('/dashboard/add-student')

  // 3. Fetch Rewards for child[0] (simplifying for MVP)
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('child_id', children[0].id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 lg:p-12 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
             <Heart className="h-4 w-4 fill-current" />
             <span className="text-[10px] font-black uppercase tracking-widest">Parent Command Center</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Welcome, {profile?.full_name?.split(' ')[0] || 'Parent'}</h1>
          <p className="text-slate-500 font-medium">Manage your children&apos;s learning journey and reward their hard work.</p>
        </div>
        <Link 
          href="/settings"
          className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-slate-500 shadow-sm"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Console */}
        <div className="lg:col-span-2 space-y-8">
           {/* Reward Contract System */}
           <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                       <Gift className="h-6 w-6 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Reward Contracts</h2>
                  </div>
                  <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-slate-100">
                    + New Reward
                  </button>
              </div>

              {rewards && rewards.length > 0 ? (
                <div className="space-y-4">
                  {rewards.map(reward => (
                    <div key={reward.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${reward.is_claimed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                             {reward.is_claimed ? <Heart className="h-5 w-5 fill-current" /> : '★'}
                          </div>
                          <div>
                             <p className="font-black text-slate-800">{reward.description}</p>
                             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Target: Level {reward.target_level}</p>
                          </div>
                       </div>
                       <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[10px] font-black uppercase text-slate-400">
                          {reward.is_claimed ? 'Completed' : 'In Progress'}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                   <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Trophy className="h-8 w-8 text-slate-300" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-800 mb-2">No Reward Contracts yet</h3>
                   <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">Create incentives like &quot;Pizza Night&quot; or &quot;Extra screen time&quot; to motivate your child.</p>
                </div>
              )}
           </section>

           {/* Performance Snapshot */}
           <section className="bg-indigo-600 rounded-[3rem] p-12 text-white relative shadow-2xl shadow-indigo-200">
              <div className="relative z-10">
                 <div className="flex items-center gap-2 text-indigo-200 font-black text-[10px] uppercase tracking-widest mb-8">
                    <LineChart className="h-4 w-4" />
                    Weekly Intelligence
                 </div>
                 <h2 className="text-4xl font-black mb-10 tracking-tight">Accuracy is up <span className="text-emerald-400">14%</span> since last week.</h2>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-md border border-white/10">
                       <p className="text-[10px] font-black uppercase text-indigo-200 mb-2">Strongest Subject</p>
                       <p className="text-xl font-bold">Mathematics (82%)</p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-[2rem] backdrop-blur-md border border-white/10">
                       <p className="text-[10px] font-black uppercase text-indigo-200 mb-2">Improvement Area</p>
                       <p className="text-xl font-bold">Verbal Reasoning</p>
                    </div>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-12 opacity-10">
                 <Target className="h-40 w-40" />
              </div>
           </section>
        </div>

        {/* Sidecar: Child Switching & Quick Actions */}
        <div className="space-y-8">
           <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <Users className="h-5 w-5" />
                 Family Profiles
              </h3>
              <div className="space-y-4">
                 {children.map(child => (
                   <div key={child.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center font-bold text-indigo-600 text-lg shadow-sm">
                         {child.name[0]}
                      </div>
                      <div className="flex-1">
                         <p className="font-bold text-slate-800">{child.name}</p>
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Level {child.level}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-all" />
                   </div>
                 ))}
              </div>
           </section>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <h4 className="text-lg font-black mb-4 underline decoration-indigo-500 decoration-4">Parent Guide</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">Studies show that consistent positive reinforcement increases learning retention by <span className="text-white font-bold">34%</span>.</p>
              <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all">
                Read Advanced Tutoring Tips
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
