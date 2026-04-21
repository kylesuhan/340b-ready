import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { xpToLevel } from '@/lib/gamification'
import { LeaderboardOptIn } from '@/components/LeaderboardOptIn'

interface LeaderEntry {
  user_id: string
  xp: number
  level: number
  current_streak: number
  leaderboard_opt_in: boolean
  profiles: { full_name: string | null } | null
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = await createServiceClient()

  // Fetch top 20 opted-in users by XP
  const { data: leaders } = await serviceClient
    .from('user_gamification')
    .select('user_id, xp, level, current_streak, leaderboard_opt_in, profiles(full_name)')
    .eq('leaderboard_opt_in', true)
    .order('xp', { ascending: false })
    .limit(20)

  // Fetch current user's gamification row
  const { data: myGam } = await supabase
    .from('user_gamification')
    .select('xp, level, current_streak, longest_streak, leaderboard_opt_in')
    .eq('user_id', user.id)
    .single()

  const myLevel = xpToLevel(myGam?.xp ?? 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-teal mr-2">⚕</span>Leaderboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Top learners ranked by XP. Opt in to appear on the board.
        </p>
      </div>

      {/* My stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-brand-navy">{myGam?.xp ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">XP earned</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-brand-teal">{myLevel.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">Level {myLevel.level}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">🔥 {myGam?.current_streak ?? 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Day streak</p>
        </div>
      </div>

      {/* XP progress bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">Level {myLevel.level} — {myLevel.label}</p>
          {myLevel.nextLevelXp && (
            <p className="text-xs text-slate-400">{myGam?.xp ?? 0} / {myLevel.nextLevelXp} XP</p>
          )}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div
            className="bg-brand-teal h-2.5 rounded-full transition-all"
            style={{ width: `${myLevel.progress}%` }}
          />
        </div>
      </div>

      {/* Opt-in toggle */}
      <LeaderboardOptIn optedIn={myGam?.leaderboard_opt_in ?? false} />

      {/* Leaderboard table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Top learners</p>
        </div>
        {(!leaders || leaders.length === 0) ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 text-sm">No one has opted in yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(leaders as LeaderEntry[]).map((entry, idx) => {
              const lvl = xpToLevel(entry.xp)
              const isMe = entry.user_id === user.id
              const displayName = entry.profiles?.full_name ?? 'Anonymous'
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-brand-pale' : ''}`}
                >
                  <span className="text-lg w-8 text-center shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {displayName}{isMe && <span className="ml-1.5 text-xs text-brand-teal font-semibold">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-400">{lvl.label} · Level {lvl.level}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand-navy">{entry.xp} XP</p>
                    {entry.current_streak > 0 && (
                      <p className="text-xs text-orange-500">🔥 {entry.current_streak}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
