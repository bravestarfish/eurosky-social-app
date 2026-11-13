import {type GestureResponderEvent} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {getTabNavigationAction} from '#/lib/routes/navigation'
import {type NavigationProp} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import * as Layout from '#/components/Layout'

/**
 * Header back button for Messages, Library and Settings. They open from your
 * profile, so when there is nothing to go back to in this stack, back goes to
 * your profile rather than to Posts.
 */
export function BackToProfileButton() {
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()

  const onPress = (evt: GestureResponderEvent) => {
    if (navigation.canGoBack()) return
    evt.preventDefault()
    navigation.dispatch(
      getTabNavigationAction('MyProfile', currentAccount?.handle),
    )
  }

  return <Layout.Header.BackButton onPress={onPress} />
}
