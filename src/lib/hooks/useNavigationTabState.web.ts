import {useNavigationState} from '@react-navigation/native'

import {getCurrentRoute, SECONDARY_TABS} from '#/lib/routes/helpers'

export function useNavigationTabState() {
  return useNavigationState(state => {
    let currentRoute = state ? getCurrentRoute(state).name : 'Home'
    return {
      isAtHome: currentRoute === 'Home',
      isAtNews: currentRoute === SECONDARY_TABS.News.rootRoute,
      isAtSearch: currentRoute === 'Search',
      isAtNotifications: currentRoute === 'Notifications',
      isAtMyProfile: currentRoute === 'MyProfile',
      isAtMessages: currentRoute === 'Messages',
      isAtLibrary: currentRoute === 'Library',
      isAtSettings: currentRoute === 'Settings',
    }
  })
}
