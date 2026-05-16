'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getLevelProgress } from '@/lib/gamification'
import { AVATAR_COLLECTION } from '@/lib/constants/avatars'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Calendar,
  Trophy,
  Gift
} from 'lucide-react'

interface SidebarProps {
  userEmail?: string
  subscriptionStatus?: string
  childName?: string
  xp?: number
  level?: number
  avatarUrl?: string | null
  role?: string
}

export function Sidebar({
  userEmail,
  subscriptionStatus,
  childName,
  xp,
  level,
  avatarUrl,
  role
}: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(role === 'parent' ? [{ label: 'Parent View', href: '/parent/dashboard', icon: Sparkles }] : []),
    { label: 'Study Plan', href: '/study-plan', icon: Calendar },
    { label: 'Practice Hubs', href: '/dashboard#hubs', icon: BookOpen },
    { label: 'Topic Library', href: '/library', icon: GraduationCap },
    { label: 'Performance', href: '/analytics', icon: BarChart3 },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { label: 'Refer a Friend', href: '/referrals', icon: Gift },
    { label: subscriptionStatus === 'pro' ? 'Billing' : 'Subscription', href: subscriptionStatus === 'pro' ? '/api/portal' : '/pricing', icon: CreditCard, isAction: subscriptionStatus === 'pro' },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]

  const isPro = subscriptionStatus === 'pro'

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-6 left-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-slate-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 z-40 transition-transform duration-300 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-5 overflow-hidden">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-6 shrink-0">
            <img
              src="/logo.png"
              alt="Ace 11+"
              className="h-12 w-12 object-contain rounded-xl"
            />
            <span className="font-bold text-slate-900 text-xl tracking-tight">Ace 11+</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex-1 space-y-1 overflow-hidden">
            {navItems.map((item: any) => {
              const isActive = pathname === item.href
              
              if (item.isAction) {
                return (
                  <form key={item.href} action={item.href} method="POST">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-between p-3 rounded-2xl font-bold transition-all group text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  </form>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center justify-between p-2.5 rounded-xl font-bold transition-all group
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {/* Pro Card */}
            {!isPro && (
              <Link href="/pricing" className="block p-3 bg-slate-900 rounded-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-1">
                    <Sparkles className="h-3 w-3" />
                    Go Premium
                  </div>
                  <p className="text-white font-bold text-sm">Unlock Mocks</p>
                  <p className="text-slate-400 text-xs mt-1">Get unlimited AI tutor help.</p>
                </div>
                <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all" />
              </Link>
            )}

            {/* Profile */}
            <div className="pt-2">
              {childName ? (
                <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-lg shadow-sm ${AVATAR_COLLECTION.find(a => a.id === avatarUrl)?.bgColor || 'bg-indigo-100'
                      }`}>
                      {AVATAR_COLLECTION.find(a => a.id === avatarUrl)?.emoji || childName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate text-sm">{childName}</p>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                        Level {level || 1}
                      </p>
                    </div>
                  </div>

                  {/* Mini XP Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${getLevelProgress(xp || 0)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                      <span>{xp || 0} XP</span>
                      <span>Next Lvl</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-1">
                  <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600 text-xs">
                    {userEmail?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate text-xs">{userEmail?.split('@')[0]}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                      {isPro ? 'Pro Member' : 'Free Account'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
