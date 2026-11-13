import {router} from '#/routes'

/** Screens opened from your profile on web, where there are no tabs. */
const PROFILE_SPACE_ROUTES = new Set(['Messages', 'Library'])

/** Path prefixes of the screens reached from Settings. */
const SETTINGS_PATH_PREFIXES = ['/settings', '/moderation']

/**
 * Whether a web route is one of the screens opened from your own profile:
 * Messages, Library, or anything in Settings. The Profile tab stays
 * highlighted on them. Native gets the same from the tab the screen is in.
 */
export function isProfileSpaceRoute(routeName: string) {
  if (PROFILE_SPACE_ROUTES.has(routeName)) return true
  const route = router.matchName(routeName)
  if (!route) return false
  const path = route.build({})
  return SETTINGS_PATH_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )
}
