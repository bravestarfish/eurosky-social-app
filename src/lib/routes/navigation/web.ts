import {
  CommonActions,
  type NavigationProp as BaseNavigationProp,
  type NavigationState,
  type ParamListBase,
  StackActions,
} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {SECONDARY_TABS} from '#/lib/routes/helpers'
import {type SidebarTab} from '#/lib/routes/tab-to-nav-item'
import {
  type CommonNavigationDestination,
  type FlatNavigatorParams,
} from '#/lib/routes/types'
import {
  type MessagesParams,
  type NavigationMode,
  type NavigatorState,
} from './actions'

export type RootNavigatorParams = FlatNavigatorParams
export type RootNavigationProp = BaseNavigationProp<RootNavigatorParams>

/** Web screens share one flat stack; the route generic scopes param updates. */
export type NavigationProp<
  ParamList extends ParamListBase = FlatNavigatorParams,
  RouteName extends keyof ParamList & keyof FlatNavigatorParams =
    keyof ParamList & keyof FlatNavigatorParams,
> = NativeStackNavigationProp<FlatNavigatorParams, RouteName>

/** Web has no tab stacks, so a tab is the route at its root. */
function getTabRoute(tab: SidebarTab, profileName: string) {
  if (tab === 'MyProfile') {
    return {name: 'Profile', params: {name: profileName}}
  }
  return {name: SECONDARY_TABS[tab]?.rootRoute ?? tab}
}

export function getTabNavigationAction(tab: SidebarTab, profileName = 'me') {
  const {name, params} = getTabRoute(tab, profileName)
  return CommonActions.navigate(name, params)
}

export function getTabResetAction(tab: SidebarTab, profileName = 'me') {
  return CommonActions.reset({
    index: 0,
    routes: [getTabRoute(tab, profileName)],
  })
}

export function getHomeNavigationAction(
  _state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  return mode === 'replace'
    ? StackActions.replace('Home')
    : CommonActions.navigate('Home')
}

export function getMessagesNavigationAction(
  {animation: _animation, ...params}: MessagesParams = {},
  _state?: NavigatorState,
  mode: NavigationMode = 'navigate',
) {
  // Native transition hints should not become query parameters in web URLs.
  return mode === 'replace'
    ? StackActions.replace('Messages', params)
    : CommonActions.navigate('Messages', params)
}

export function getCommonNavigationAction(
  destination: CommonNavigationDestination,
  _state?: NavigationState,
) {
  return CommonActions.navigate(destination)
}
