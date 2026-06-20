'use client'

import { useState, useEffect } from 'react'
import { ConversionOnboarding } from './ConversionOnboarding'

interface DashboardOnboardingTriggerProps {
  childId: string
  childName: string
  hasCompletedOnboarding: boolean
}

export function DashboardOnboardingTrigger({ childId, childName, hasCompletedOnboarding }: DashboardOnboardingTriggerProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Show onboarding if not completed
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(true), 250)
      return () => clearTimeout(timer)
    }
  }, [hasCompletedOnboarding])

  return (
    <ConversionOnboarding 
      childId={childId}
      childName={childName}
      isOpen={showOnboarding}
      onClose={() => setShowOnboarding(false)}
    />
  )
}
