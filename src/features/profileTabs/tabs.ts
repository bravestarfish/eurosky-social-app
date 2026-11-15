/** The profile tabs an owner can choose to show, in display order. */
export const PROFILE_TAB_KEYS = [
  'posts',
  'replies',
  'media',
  'likes',
  'feeds',
  'starterPacks',
  'lists',
] as const

export type ProfileTabKey = (typeof PROFILE_TAB_KEYS)[number]

/** Shown when the owner has not chosen: the first four. */
export const DEFAULT_PROFILE_TABS: ProfileTabKey[] = [
  'posts',
  'replies',
  'media',
  'likes',
]

export const PROFILE_TABS_COLLECTION = 'social.mu.profileTabs'

function isProfileTabKey(value: unknown): value is ProfileTabKey {
  return (PROFILE_TAB_KEYS as readonly unknown[]).includes(value)
}

/**
 * Reads a stored record leniently: unknown names are dropped, duplicates
 * removed and the result put in display order. A record that is not shaped
 * like ours, or that keeps nothing, falls back to the defaults so a profile
 * never ends up with no tabs.
 */
export function parseProfileTabs(value: unknown): ProfileTabKey[] {
  const tabs = (value as {tabs?: unknown} | null | undefined)?.tabs
  if (!Array.isArray(tabs)) return DEFAULT_PROFILE_TABS
  const chosen = new Set(tabs.filter(isProfileTabKey))
  const ordered = PROFILE_TAB_KEYS.filter(key => chosen.has(key))
  return ordered.length > 0 ? ordered : DEFAULT_PROFILE_TABS
}

/** Puts a selection in display order, dropping anything unknown. */
export function normalizeProfileTabs(values: string[]): ProfileTabKey[] {
  const chosen = new Set(values)
  return PROFILE_TAB_KEYS.filter(key => chosen.has(key))
}

export function sameProfileTabs(a: ProfileTabKey[], b: ProfileTabKey[]) {
  return a.length === b.length && a.every((key, i) => key === b[i])
}
