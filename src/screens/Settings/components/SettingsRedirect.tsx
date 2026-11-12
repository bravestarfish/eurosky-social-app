import {useEffect} from 'react'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import * as Layout from '#/components/Layout'

/**
 * Stands in for a settings page that was folded into another one, so old
 * links and bookmarks still land somewhere sensible.
 */
export function SettingsRedirect({
  to,
}: {
  to: keyof CommonNavigatorParams & `${string}Settings`
}) {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.dispatch(StackActions.replace(to))
  }, [navigation, to])

  return <Layout.Screen />
}
