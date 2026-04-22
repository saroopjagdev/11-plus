'use client'

import React, { useState } from 'react'
import { AVATAR_COLLECTION } from '@/lib/constants/avatars'
import { updateChildAvatar } from '@/app/actions/child'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader2 } from 'lucide-react'

interface AvatarSelectorProps {
  childId: string
  currentAvatarId?: string
  onClose: () => void
}

export function AvatarSelector({ childId, currentAvatarId, onClose }: AvatarSelectorProps) {
  const [selectedId, setSelectedId] = useState(currentAvatarId)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedId) return
    setIsSaving(true)
    try {
      await updateChildAvatar(childId, selectedId)
      onClose()
    } catch (error) {
      console.error('Failed to save avatar:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Choose Your Hero</h2>
            <p className="text-slate-500 text-sm">Select an avatar for the leaderboard</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {AVATAR_COLLECTION.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedId(avatar.id)}
                className={`relative p-6 rounded-3xl transition-all group ${
                  selectedId === avatar.id 
                    ? 'ring-4 ring-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <div className={`h-16 w-16 mx-auto mb-4 rounded-2xl ${avatar.bgColor} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                  {avatar.emoji}
                </div>
                <p className={`text-xs font-bold text-center ${selectedId === avatar.id ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {avatar.name}
                </p>
                {selectedId === avatar.id && (
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-sm">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedId}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Set as Avatar'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
