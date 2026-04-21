/**
 * Gamification engine — XP, levels, streaks, badges.
 * All writes use the service client (called from API routes only).
 */

export const XP_VALUES = {
  lesson_complete: 10,
  quiz_pass: 100,
  quiz_perfect: 150,       // 100% score
  quiz_first_try: 50,      // bonus for passing on attempt #1
  all_modules_complete: 500,
} as const

export const LEVELS = [
  { level: 1, min: 0,    label: 'Novice' },
  { level: 2, min: 50,   label: 'Learner' },
  { level: 3, min: 150,  label: 'Practitioner' },
  { level: 4, min: 350,  label: 'Specialist' },
  { level: 5, min: 650,  label: 'Expert' },
  { level: 6, min: 1000, label: '340B Ready' },
] as const

export function xpToLevel(xp: number): { level: number; label: string; nextLevelXp: number | null; progress: number } {
  let current: typeof LEVELS[number] = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min) current = l
  }
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level) + 1
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null
  const progress = next
    ? Math.round(((xp - current.min) / (next.min - current.min)) * 100)
    : 100
  return { level: current.level, label: current.label, nextLevelXp: next?.min ?? null, progress }
}

export const BADGES: Record<string, { id: string; label: string; description: string; icon: string }> = {
  first_pass: {
    id: 'first_pass',
    label: 'First Pass',
    description: 'Passed a quiz on your first attempt.',
    icon: '🎯',
  },
  perfect_score: {
    id: 'perfect_score',
    label: 'Perfect Score',
    description: 'Scored 100% on a quiz.',
    icon: '💯',
  },
  comeback: {
    id: 'comeback',
    label: 'Comeback',
    description: 'Passed a quiz after a previous failed attempt.',
    icon: '💪',
  },
  on_fire: {
    id: 'on_fire',
    label: 'On Fire',
    description: 'Maintained a 7-day study streak.',
    icon: '🔥',
  },
  speed_run: {
    id: 'speed_run',
    label: 'Speed Run',
    description: 'Passed a quiz in under 5 minutes.',
    icon: '⚡',
  },
  halfway: {
    id: 'halfway',
    label: 'Halfway There',
    description: 'Completed modules 1–3.',
    icon: '⚕',
  },
  certified: {
    id: 'certified',
    label: '340B Ready',
    description: 'Completed all 5 modules.',
    icon: '🏆',
  },
}

// ── Service-role helpers (called from API routes) ────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureGamificationRow(serviceClient: any, userId: string) {
  const { data } = await serviceClient
    .from('user_gamification')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!data) {
    await serviceClient.from('user_gamification').insert({ user_id: userId })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardXP(serviceClient: any, userId: string, amount: number) {
  await ensureGamificationRow(serviceClient, userId)

  const { data } = await serviceClient
    .from('user_gamification')
    .select('xp')
    .eq('user_id', userId)
    .single()

  const newXp = (data?.xp ?? 0) + amount
  const { level } = xpToLevel(newXp)

  await serviceClient
    .from('user_gamification')
    .update({ xp: newXp, level })
    .eq('user_id', userId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStreak(serviceClient: any, userId: string) {
  await ensureGamificationRow(serviceClient, userId)

  const { data } = await serviceClient
    .from('user_gamification')
    .select('current_streak, longest_streak, last_activity_date')
    .eq('user_id', userId)
    .single()

  const today = new Date().toISOString().slice(0, 10)
  const last = data?.last_activity_date

  if (last === today) return // already updated today

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const newStreak = last === yesterdayStr ? (data?.current_streak ?? 0) + 1 : 1
  const longest = Math.max(newStreak, data?.longest_streak ?? 0)

  await serviceClient
    .from('user_gamification')
    .update({ current_streak: newStreak, longest_streak: longest, last_activity_date: today })
    .eq('user_id', userId)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardBadge(serviceClient: any, userId: string, badgeId: string): Promise<boolean> {
  const { error } = await serviceClient
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badgeId })

  return !error // false if already earned (unique constraint)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkAndAwardBadges(
  serviceClient: any,
  userId: string,
  context: {
    quizPassed?: boolean
    score?: number               // 0–1
    attemptNumber?: number       // 1 = first try
    timeTakenSeconds?: number
    moduleOrderIndex?: number
    totalModulesCompleted?: number
  }
): Promise<string[]> {
  const awarded: string[] = []

  const { quizPassed, score, attemptNumber, timeTakenSeconds, totalModulesCompleted } = context

  if (quizPassed) {
    if (attemptNumber === 1) {
      if (await awardBadge(serviceClient, userId, 'first_pass')) awarded.push('first_pass')
    }
    if (attemptNumber && attemptNumber > 1) {
      if (await awardBadge(serviceClient, userId, 'comeback')) awarded.push('comeback')
    }
    if (score === 1) {
      if (await awardBadge(serviceClient, userId, 'perfect_score')) awarded.push('perfect_score')
    }
    if (timeTakenSeconds && timeTakenSeconds < 300) {
      if (await awardBadge(serviceClient, userId, 'speed_run')) awarded.push('speed_run')
    }
    if (totalModulesCompleted === 3) {
      if (await awardBadge(serviceClient, userId, 'halfway')) awarded.push('halfway')
    }
    if (totalModulesCompleted === 5) {
      if (await awardBadge(serviceClient, userId, 'certified')) awarded.push('certified')
    }
  }

  // Streak badge (checked independently)
  const { data: gam } = await serviceClient
    .from('user_gamification')
    .select('current_streak')
    .eq('user_id', userId)
    .single()

  if ((gam?.current_streak ?? 0) >= 7) {
    if (await awardBadge(serviceClient, userId, 'on_fire')) awarded.push('on_fire')
  }

  return awarded
}
