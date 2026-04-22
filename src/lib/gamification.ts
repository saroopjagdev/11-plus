/**
 * Gamification Logic for Ace11+
 * Handles XP calculation and leveling thresholds.
 */

export const POINTS_PER_CORRECT_ANSWER = 10
export const BASE_LEVEL_THRESHOLD = 500

/**
 * Calculates the current level based on total XP.
 * Uses a basic curve where leveling up gets exponentially harder.
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculates XP needed to reached the NEXT level.
 */
export function getXPThreshold(level: number): number {
  return Math.pow(level, 2) * 100
}

/**
 * Returns the progress percentage toward the next level.
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp)
  const currentLevelStart = getXPThreshold(currentLevel - 1)
  const nextLevelThreshold = getXPThreshold(currentLevel)
  
  const xpInCurrentLevel = xp - currentLevelStart
  const range = nextLevelThreshold - currentLevelStart
  
  return Math.min(Math.round((xpInCurrentLevel / range) * 100), 100)
}
