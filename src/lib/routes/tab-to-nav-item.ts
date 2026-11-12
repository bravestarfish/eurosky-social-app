import {type Events} from '#/analytics/metrics/types'

/** Destinations in the main bottom bar. */
export type MainNavTab =
  'Home' | 'News' | 'Search' | 'Notifications' | 'MyProfile'

/** Destinations in the bar shown on your own profile. */
export type ProfileNavTab = 'Messages' | 'Library' | 'Settings'

export type SharedNavTab = MainNavTab | ProfileNavTab

export type SidebarTab = SharedNavTab

export const TAB_TO_NAV_ITEM: Record<
  SharedNavTab,
  Events['nav:click']['item']
> = {
  Home: 'home',
  News: 'news',
  Search: 'search',
  Notifications: 'notifications',
  MyProfile: 'profile',
  Messages: 'messages',
  Library: 'library',
  Settings: 'settings',
}
