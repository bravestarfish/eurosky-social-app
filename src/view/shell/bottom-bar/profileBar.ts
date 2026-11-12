import {getCurrentRoute} from '#/lib/routes/helpers'
import {type State} from '#/lib/routes/types'
import {router} from '#/routes'

/**
 * Tabs that open from the Profile bar. Everything inside them keeps the
 * Profile bar, so settings sub-pages and moderation screens do too.
 */
const PROFILE_BAR_TABS = new Set(['MessagesTab', 'LibraryTab', 'SettingsTab'])

/** Route names that belong to the Profile bar on web, where there are no tabs. */
const PROFILE_BAR_ROUTES = new Set(['Messages', 'Library'])

/** Path prefixes of the screens reached from Settings. */
const SETTINGS_PATH_PREFIXES = ['/settings', '/moderation']

/**
 * Whether the bottom bar should be the Profile bar (Home, Messages, Library,
 * Settings, Switch) rather than the main bar, on native.
 *
 * Only your own profile root swaps the bar. A post or someone else's profile
 * opened from it gets the main bar back, so it is clear you have left your own
 * space.
 */
export function shouldShowProfileBarNative(state: State | undefined) {
  if (!state) return false
  const activeTab = state.routes[state.index || 0]?.name
  if (!activeTab) return false
  if (PROFILE_BAR_TABS.has(activeTab)) return true
  if (activeTab === 'MyProfileTab') {
    return getCurrentRoute(state).name === 'MyProfile'
  }
  return false
}

/**
 * The web equivalent of `shouldShowProfileBarNative`. Web uses one flat stack,
 * so this goes by the current route and, for profiles, whose profile it is.
 */
export function shouldShowProfileBarWeb({
  routeName,
  profileName,
  currentHandle,
  currentDid,
}: {
  routeName: string
  profileName?: string
  currentHandle?: string
  currentDid?: string
}) {
  if (PROFILE_BAR_ROUTES.has(routeName)) return true
  if (routeName === 'Profile') {
    return (
      !!profileName &&
      (profileName === currentHandle || profileName === currentDid)
    )
  }
  return isSettingsRoute(routeName)
}

function isSettingsRoute(routeName: string) {
  const route = router.matchName(routeName)
  if (!route) return false
  const path = route.build({})
  return SETTINGS_PATH_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  )
}
