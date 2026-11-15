import {type JSX} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions} from '@react-navigation/native'

import {PressableScale} from '#/lib/custom-animations/PressableScale'
import {BOTTOM_BAR_AVI} from '#/lib/demo'
import {useHaptics} from '#/lib/haptics'
import {useDedupe} from '#/lib/hooks/useDedupe'
import {useHideBottomBarBorder} from '#/lib/hooks/useHideBottomBarBorder'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {useNavigationTabState} from '#/lib/hooks/useNavigationTabState'
import {clamp} from '#/lib/numbers'
import {getTabState, TabState} from '#/lib/routes/helpers'
import {type SharedNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {emitSoftReset} from '#/state/events'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {Logotype} from '#/view/icons/Logotype'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {AccountMenuDialog} from '#/components/dialogs/AccountMenu'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {
  HomeOpen_Filled_Corner0_Rounded as HomeFilled,
  HomeOpen_Stoke2_Corner0_Rounded as Home,
} from '#/components/icons/HomeOpen'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Newspaper_Filled_Corner2_Rounded as NewspaperFilled,
  Newspaper_Stroke2_Corner2_Rounded as Newspaper,
} from '#/components/icons/Newspaper'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {isFollowingV2HomeDotEnabled} from '#/features/followingV2/eligibility'
import {useActorStatus} from '#/features/liveNow'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {styles} from './BottomBarStyles'

export function BottomBar({navigation}: BottomTabBarProps) {
  const {hasSession} = useSession()
  const t = useTheme()
  const {t: l} = useLingui()
  const safeAreaInsets = useSafeAreaInsets()
  const {footerHeight} = useShellLayout()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const hideBorder = useHideBottomBarBorder()

  const showSignIn = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }

  const showCreateAccount = () => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
  }

  return (
    <Animated.View
      style={[
        styles.bottomBar,
        t.atoms.bg,
        hideBorder
          ? {borderColor: t.atoms.bg.backgroundColor}
          : t.atoms.border_contrast_low,
        {paddingBottom: clamp(safeAreaInsets.bottom, 15, 60)},
        footerMinimalShellTransform,
      ]}
      onLayout={e => {
        footerHeight.set(e.nativeEvent.layout.height)
      }}>
      {hasSession ? (
        <MainBarItems navigation={navigation} />
      ) : (
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 14,
            paddingBottom: 2,
            paddingLeft: 14,
            paddingRight: 6,
            gap: 8,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <View style={{paddingTop: 4}}>
              <Logotype width={44} fill={t.atoms.text.color} />
            </View>
          </View>

          <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
            <Button
              onPress={showCreateAccount}
              label={l`Create account`}
              size="small"
              color="primary">
              <ButtonText>
                <Trans>Create account</Trans>
              </ButtonText>
            </Button>
            <Button
              onPress={showSignIn}
              label={l`Sign in`}
              size="small"
              color="secondary">
              <ButtonText>
                <Trans>Sign in</Trans>
              </ButtonText>
            </Button>
          </View>
        </View>
      )}
    </Animated.View>
  )
}

/**
 * Selects a tab the way the bottom bar always has: a tap on the tab you are
 * already at the root of scrolls it to the top, a tap on a tab you are deeper
 * in pops back to its root, and anything else switches tabs.
 */
function useOnPressTab(navigation: BottomTabBarProps['navigation']) {
  const ax = useAnalytics()
  const dedupe = useDedupe()

  return (tab: SharedNavTab) => {
    ax.metric('nav:click', {item: TAB_TO_NAV_ITEM[tab], surface: 'bottomBar'})
    const state = navigation.getState()
    const tabState = getTabState(state, tab)
    if (tabState === TabState.InsideAtRoot) {
      emitSoftReset()
    } else if (tabState === TabState.Inside) {
      // find the correct navigator in which to pop-to-top
      const target = state.routes.find(route => route.name === `${tab}Tab`)
        ?.state?.key
      dedupe(() => {
        if (target) {
          navigation.dispatch({
            ...StackActions.popToTop(),
            target,
          })
        } else {
          navigation.reset({
            index: 0,
            routes: [{name: `${tab}Tab`}],
          })
        }
      })
    } else {
      dedupe(() => navigation.navigate(`${tab}Tab`))
    }
  }
}

function MainBarItems({
  navigation,
}: {
  navigation: BottomTabBarProps['navigation']
}) {
  const {currentAccount} = useSession()
  const t = useTheme()
  const {t: l} = useLingui()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const {
    isAtHome,
    isAtNews,
    isAtSearch,
    isAtNotifications,
    isAtMyProfile: isAtProfileRoot,
    isAtMessages,
    isAtLibrary,
    isAtSettings,
  } = useNavigationTabState()
  /*
   * Messages, Library and Settings open from your profile, so the Profile tab
   * stays highlighted while you are in them.
   */
  const isAtMyProfile =
    isAtProfileRoot || isAtMessages || isAtLibrary || isAtSettings
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const hasHomeBadge = useHomeBadge()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const accountMenuControl = useDialogControl()
  const haptics = useHaptics()
  const onPressTab = useOnPressTab(navigation)
  const [demoMode] = useDemoMode()
  const {isActive: live} = useActorStatus(profile)
  const isLabeler = profile?.associated?.labeler
  const moderationInboxCount = useModerationInboxBadgeCount()
  const hasUnreadMessages =
    !aa.flags.chatDisabled && numUnreadMessages.count > 0

  const onLongPressProfile = () => {
    haptics.longPress()
    accountMenuControl.open()
  }

  /* On your own profile a tap has nowhere new to go, so it opens the menu. */
  const onPressProfile = () => {
    if (
      getTabState(navigation.getState(), 'MyProfile') === TabState.InsideAtRoot
    ) {
      haptics.tap()
      accountMenuControl.open()
    } else {
      onPressTab('MyProfile')
    }
  }

  return (
    <>
      <AccountMenuDialog control={accountMenuControl} />
      <Btn
        testID="bottomBarHomeBtn"
        label={l({message: 'Home', context: 'bottom bar tab'})}
        isActive={isAtHome}
        icon={
          <TabIcon isActive={isAtHome} Icon={Home} ActiveIcon={HomeFilled} />
        }
        hasNew={hasHomeBadge && isFollowingV2HomeDotEnabled(ax)}
        onPress={() => onPressTab('Home')}
        accessibilityRole="tab"
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarNewsBtn"
        label={l({message: 'News', context: 'bottom bar tab'})}
        isActive={isAtNews}
        icon={
          <TabIcon
            isActive={isAtNews}
            Icon={Newspaper}
            ActiveIcon={NewspaperFilled}
          />
        }
        onPress={() => onPressTab('News')}
        accessibilityRole="tab"
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarSearchBtn"
        label={l({message: 'Search', context: 'bottom bar tab'})}
        isActive={isAtSearch}
        icon={
          <TabIcon
            isActive={isAtSearch}
            Icon={MagnifyingGlass}
            ActiveIcon={MagnifyingGlassFilled}
          />
        }
        onPress={() => onPressTab('Search')}
        accessibilityRole="search"
        accessibilityHint=""
      />
      <Btn
        testID="bottomBarNotificationsBtn"
        label={l({
          message: 'Notifications',
          context: 'bottom bar tab',
          comment:
            'Bottom bar tab label. Space is tight, so use a short word if your language has one, e.g. "Alerts".',
        })}
        isActive={isAtNotifications}
        icon={
          <TabIcon
            isActive={isAtNotifications}
            Icon={Bell}
            ActiveIcon={BellFilled}
          />
        }
        onPress={() => onPressTab('Notifications')}
        notificationCount={numUnreadNotifications}
        accessible={true}
        accessibilityRole="tab"
        accessibilityHint={
          numUnreadNotifications === ''
            ? ''
            : l({
                message: plural(numUnreadNotifications ?? 0, {
                  one: '# unread item',
                  other: '# unread items',
                }),
              })
        }
      />
      <Btn
        testID="bottomBarProfileBtn"
        label={l({message: 'Profile', context: 'bottom bar tab'})}
        isActive={isAtMyProfile}
        icon={
          <View style={styles.ctrlIconSizingWrapper}>
            <View
              style={[
                styles.ctrlIcon,
                isLabeler ? styles.profileIconSquare : styles.profileIcon,
                isAtMyProfile && [
                  isLabeler ? styles.onProfileSquare : styles.onProfile,
                  {
                    borderColor: t.palette.primary_500,
                    borderWidth: live ? 0 : 2,
                  },
                ],
              ]}>
              <UserAvatar
                avatar={demoMode ? BOTTOM_BAR_AVI : profile?.avatar}
                size={ICON_WIDTH - (isAtMyProfile ? 4 : 2)}
                // See https://github.com/bluesky-social/social-app/pull/1801:
                usePlainRNImage={true}
                type={profile?.associated?.labeler ? 'labeler' : 'user'}
                live={live}
                hideLiveBadge
              />
            </View>
          </View>
        }
        // Messages and Settings live on your profile, so flag what is new there.
        hasNew={hasUnreadMessages || moderationInboxCount > 0}
        onPress={onPressProfile}
        onLongPress={onLongPressProfile}
        accessibilityRole="tab"
        accessibilityHint={
          hasUnreadMessages
            ? l`You have unread messages. Long-press for accounts, messages, library and settings.`
            : l`Long-press for accounts, messages, library and settings.`
        }
      />
    </>
  )
}

const ICON_WIDTH = 26

function TabIcon({
  isActive,
  Icon,
  ActiveIcon,
}: {
  isActive: boolean
  Icon: React.ComponentType<SVGIconProps>
  ActiveIcon: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  const Component = isActive ? ActiveIcon : Icon
  return (
    <Component
      width={ICON_WIDTH}
      fill={
        isActive ? t.palette.primary_500 : t.atoms.text_contrast_medium.color
      }
      style={styles.ctrlIcon}
    />
  )
}

interface BtnProps extends Pick<
  React.ComponentProps<typeof PressableScale>,
  'accessible' | 'accessibilityRole' | 'accessibilityHint'
> {
  testID?: string
  icon: JSX.Element
  label: string
  isActive: boolean
  notificationCount?: string
  hasNew?: boolean
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

function Btn({
  testID,
  icon,
  label,
  isActive,
  hasNew,
  notificationCount,
  onPress,
  onLongPress,
  accessible,
  accessibilityRole,
  accessibilityHint,
}: BtnProps) {
  const t = useTheme()

  return (
    <PressableScale
      testID={testID}
      style={[styles.ctrl, a.flex_1]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      accessibilityState={{selected: isActive}}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      targetScale={0.8}
      accessibilityLargeContentTitle={label}
      accessibilityShowsLargeContentViewer>
      {icon}
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
        style={[
          styles.ctrlLabel,
          isActive
            ? {color: t.palette.primary_500}
            : t.atoms.text_contrast_medium,
        ]}>
        {label}
      </Text>
      {notificationCount ? (
        <View
          style={[
            styles.notificationCount,
            a.rounded_full,
            {backgroundColor: t.palette.primary_500},
          ]}>
          <Text
            style={styles.notificationCountLabel}
            maxFontSizeMultiplier={1.5}>
            {notificationCount}
          </Text>
        </View>
      ) : hasNew ? (
        <View
          style={[styles.hasNewBadge, {backgroundColor: t.palette.primary_500}]}
        />
      ) : null}
    </PressableScale>
  )
}
