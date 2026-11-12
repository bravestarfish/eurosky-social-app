import {useEffect} from 'react'
import {BackHandler, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {NavigationBar} from 'expo-navigation-bar'
import {StatusBar} from 'expo-status-bar'
import {BottomSheetOutlet} from '@bsky.app/bottom-sheet'
import {updateActiveViewAsync} from '@bsky.app/expo-bluesky-swiss-army/src/VisibilityView'
import {useNavigation} from '@react-navigation/native'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {useIntentHandler} from '#/lib/hooks/useIntentHandler'
import {useNotificationsHandler} from '#/lib/hooks/useNotificationHandler'
import {useOTAUpdateRecovery} from '#/lib/hooks/useOTAUpdates'
import {useNotificationsRegistration} from '#/lib/notifications/notifications'
import {useDialogFullyExpandedCountContext} from '#/state/dialogs'
import {useSession} from '#/state/session'
import {useCloseAnyActiveElement} from '#/state/util'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Deactivated} from '#/screens/Deactivated'
import {Takendown} from '#/screens/Takendown'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {setSystemUITheme} from '#/alf/util/systemUI'
import {AgeAssuranceRedirectDialog} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
import {EmailDialog} from '#/components/dialogs/EmailDialog'
import {InAppBrowserConsentDialog} from '#/components/dialogs/InAppBrowserConsent'
import {LinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {MutedWordsDialog} from '#/components/dialogs/MutedWords'
import {NuxDialogs} from '#/components/dialogs/nuxs'
import {SigninDialog} from '#/components/dialogs/Signin'
import {Lightbox} from '#/components/Lightbox'
import {GlobalReportDialog} from '#/components/moderation/ReportDialog'
import {
  Outlet as PolicyUpdateOverlayPortalOutlet,
  usePolicyUpdateContext,
} from '#/components/PolicyUpdateOverlay'
import {Outlet as PortalOutlet} from '#/components/Portal'
import {useAgeAssurance} from '#/ageAssurance'
import {DataUnavailableScreen} from '#/ageAssurance/components/DataUnavailableScreen'
import {NoAccessScreen} from '#/ageAssurance/components/NoAccessScreen'
import {RedirectOverlay} from '#/ageAssurance/components/RedirectOverlay'
import {PassiveAnalytics} from '#/analytics/PassiveAnalytics'
import {IS_ANDROID, IS_IOS, IS_LIQUID_GLASS} from '#/env'
import {PetCompanion} from '#/features/petCompanion'
import {RoutesContainer, TabsNavigator} from '#/Navigation'
import {Composer} from './Composer'

function ShellInner() {
  const insets = useSafeAreaInsets()
  const {state: policyUpdateState} = usePolicyUpdateContext()

  const closeAnyActiveElement = useCloseAnyActiveElement()

  useNotificationsRegistration()
  useNotificationsHandler()

  useEffect(() => {
    if (IS_ANDROID) {
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        return closeAnyActiveElement()
      })

      return () => {
        listener.remove()
      }
    }
  }, [closeAnyActiveElement])

  // HACK
  // expo-video doesn't like it when you try and move a `player` to another `VideoView`. Instead, we need to actually
  // unregister that player to let the new screen register it. This is only a problem on Android, so we only need to
  // apply it there.
  // The `state` event should only fire whenever we push or pop to a screen, and should not fire consecutively quickly.
  // To be certain though, we will also dedupe these calls.
  const navigation = useNavigation()
  const dedupe = useDedupe(1000)
  useEffect(() => {
    if (!IS_ANDROID) return
    const onFocusOrBlur = () => {
      setTimeout(() => {
        dedupe(updateActiveViewAsync)
      }, 500)
    }
    navigation.addListener('state', onFocusOrBlur)
    return () => {
      navigation.removeListener('state', onFocusOrBlur)
    }
  }, [dedupe, navigation])

  return (
    <>
      <View style={[a.h_full]}>
        <ErrorBoundary
          style={{paddingTop: insets.top, paddingBottom: insets.bottom}}>
          <TabsNavigator />
        </ErrorBoundary>
      </View>
      <PetCompanion />
      <Composer />
      <MutedWordsDialog />
      <SigninDialog />
      <EmailDialog />
      <AgeAssuranceRedirectDialog />
      <InAppBrowserConsentDialog />
      <LinkWarningDialog />
      <Lightbox />
      <NuxDialogs />
      <GlobalReportDialog />

      {/* Until policy update has been completed by the user, don't render anything that is portaled */}
      {policyUpdateState.completed && (
        <>
          <PortalOutlet />
          <BottomSheetOutlet />
        </>
      )}

      <PolicyUpdateOverlayPortalOutlet />
    </>
  )
}

export function Shell() {
  const t = useTheme()
  const aa = useAgeAssurance()
  const {currentAccount} = useSession()
  const fullyExpandedCount = useDialogFullyExpandedCountContext()
  const {gtMobile} = useBreakpoints()

  useIntentHandler()
  useOTAUpdateRecovery()

  useEffect(() => {
    setSystemUITheme('theme', t)
  }, [t])

  return (
    <View testID="mobileShellView" style={[a.h_full, t.atoms.bg]}>
      <StatusBar
        animated
        hidden={false}
        verticalBarBehaviorIOS={gtMobile ? 'automatic' : 'disabled'}
        style={
          t.name !== 'light' ||
          (IS_IOS && !IS_LIQUID_GLASS && fullyExpandedCount > 0)
            ? 'light'
            : 'dark'
        }
      />
      <NavigationBar
        hidden={false}
        style={t.name !== 'light' ? 'light' : 'dark'}
      />
      {currentAccount?.status === 'takendown' ? (
        <Takendown />
      ) : currentAccount?.status === 'deactivated' ? (
        <Deactivated />
      ) : (
        <>
          {aa.state.error === 'account-data' ? (
            <DataUnavailableScreen />
          ) : aa.state.access === aa.Access.None ? (
            <NoAccessScreen />
          ) : (
            <RoutesContainer>
              <ShellInner />
            </RoutesContainer>
          )}

          <RedirectOverlay />
        </>
      )}

      <PassiveAnalytics />
    </View>
  )
}
