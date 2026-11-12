import {type JSX} from 'react'
import {type GestureResponderEvent, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {StackActions, useNavigationState} from '@react-navigation/native'

import {UNREAD_NOTIFICATION_CAP} from '#/lib/constants'
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
import {useUpdateAllRead} from '#/state/queries/messages/update-all-read'
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
import {SwitchAccountDialog} from '#/components/dialogs/SwitchAccount'
import {ArrowsSwap_Stroke2_Corner2_Rounded as SwitchIcon} from '#/components/icons/ArrowsSwap'
import {
  Bell_Filled_Corner0_Rounded as BellFilled,
  Bell_Stroke2_Corner0_Rounded as Bell,
} from '#/components/icons/Bell'
import {
  Bookmark_Filled_Corner0_Rounded as BookmarkFilled,
  Bookmark_Stroke2_Corner0_Rounded as Bookmark,
} from '#/components/icons/Bookmark'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheckIcon} from '#/components/icons/CircleCheck'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {HomeOpen_Stoke2_Corner0_Rounded as Home} from '#/components/icons/HomeOpen'
import {Inbox_Stroke2_Corner2_Rounded as InboxIcon} from '#/components/icons/Inbox'
import {
  MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
  MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
} from '#/components/icons/MagnifyingGlass'
import {
  Message_Stroke2_Corner0_Rounded as Message,
  Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message'
import {
  Newspaper_Filled_Corner2_Rounded as NewspaperFilled,
  Newspaper_Stroke2_Corner2_Rounded as Newspaper,
} from '#/components/icons/Newspaper'
import {
  Posts_Stroke2_Corner2_Rounded as Posts,
  Posts_Stroke3_Corner2_Rounded as PostsActive,
} from '#/components/icons/Posts'
import {
  SettingsGear2_Filled_Corner0_Rounded as SettingsFilled,
  SettingsGear2_Stroke2_Corner0_Rounded as Settings,
} from '#/components/icons/Settings'
import * as Menu from '#/components/Menu'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {isFollowingV2HomeDotEnabled} from '#/features/followingV2/eligibility'
import {useActorStatus} from '#/features/liveNow'
import {useDemoMode} from '#/storage/hooks/demo-mode'
import {styles} from './BottomBarStyles'
import {shouldShowProfileBarNative} from './profileBar'

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
  const showProfileBar = useNavigationState(shouldShowProfileBarNative)

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
        showProfileBar ? (
          <ProfileBarItems navigation={navigation} />
        ) : (
          <MainBarItems navigation={navigation} />
        )
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
function useOnPressTab(
  navigation: BottomTabBarProps['navigation'],
  surface: 'bottomBar' | 'profileBar',
) {
  const ax = useAnalytics()
  const dedupe = useDedupe()

  return (tab: SharedNavTab) => {
    ax.metric('nav:click', {item: TAB_TO_NAV_ITEM[tab], surface})
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
  const {isAtHome, isAtNews, isAtSearch, isAtNotifications, isAtMyProfile} =
    useNavigationTabState()
  const numUnreadNotifications = useUnreadNotifications()
  const numUnreadMessages = useUnreadMessageCount()
  const hasHomeBadge = useHomeBadge()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const accountSwitchControl = useDialogControl()
  const haptics = useHaptics()
  const onPressTab = useOnPressTab(navigation, 'bottomBar')
  const [demoMode] = useDemoMode()
  const {isActive: live} = useActorStatus(profile)
  const isLabeler = profile?.associated?.labeler
  const hasUnreadMessages =
    !aa.flags.chatDisabled && numUnreadMessages.count > 0

  const onLongPressProfile = () => {
    haptics.longPress()
    accountSwitchControl.open()
  }

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />
      <Btn
        testID="bottomBarHomeBtn"
        label={l({message: 'Posts', context: 'bottom bar tab'})}
        isActive={isAtHome}
        icon={
          <TabIcon isActive={isAtHome} Icon={Posts} ActiveIcon={PostsActive} />
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
        // Messages are no longer in this bar, so flag unread ones here.
        hasNew={hasUnreadMessages}
        onPress={() => onPressTab('MyProfile')}
        onLongPress={onLongPressProfile}
        accessibilityRole="tab"
        accessibilityHint={
          hasUnreadMessages
            ? l`You have unread messages. Long-press to switch account.`
            : l`Long-press to switch account.`
        }
      />
    </>
  )
}

/**
 * The bar shown on your own profile and on the screens it opens: Library,
 * Settings and Messages. Home goes back to Posts and the main bar.
 */
function ProfileBarItems({
  navigation,
}: {
  navigation: BottomTabBarProps['navigation']
}) {
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const {isAtMessages, isAtLibrary, isAtSettings} = useNavigationTabState()
  const numUnreadMessages = useUnreadMessageCount()
  const moderationInboxCount = useModerationInboxBadgeCount()
  const accountSwitchControl = useDialogControl()
  const messagesMenuControl = Menu.useMenuControl()
  const haptics = useHaptics()
  const onPressTab = useOnPressTab(navigation, 'profileBar')

  const onLongPressMessages = () => {
    if (aa.flags.chatDisabled) return
    haptics.longPress()
    messagesMenuControl.open()
  }

  const onPressSwitch = () => {
    ax.metric('nav:click', {item: 'switchAccount', surface: 'profileBar'})
    accountSwitchControl.open()
  }

  const settingsCount =
    moderationInboxCount > 0
      ? moderationInboxCount >= UNREAD_NOTIFICATION_CAP
        ? l({
            message: `${i18n.number(UNREAD_NOTIFICATION_CAP - 1)}+`,
            comment:
              'Displayed when the number of notifications exceeds the cap – for example, 99+',
          })
        : i18n.number(moderationInboxCount)
      : undefined

  return (
    <>
      <SwitchAccountDialog control={accountSwitchControl} />
      <MessagesTabMenu control={messagesMenuControl} />
      <Btn
        testID="profileBarHomeBtn"
        label={l({message: 'Home', context: 'profile bar tab'})}
        isActive={false}
        icon={<TabIcon isActive={false} Icon={Home} ActiveIcon={Home} />}
        onPress={() => onPressTab('Home')}
        accessibilityRole="tab"
        accessibilityHint={l`Goes back to Posts`}
      />
      <Btn
        testID="profileBarMessagesBtn"
        label={l({message: 'Messages', context: 'profile bar tab'})}
        isActive={isAtMessages}
        icon={
          <TabIcon
            isActive={isAtMessages}
            Icon={Message}
            ActiveIcon={MessageFilled}
          />
        }
        onPress={() => onPressTab('Messages')}
        onLongPress={onLongPressMessages}
        notificationCount={
          aa.flags.chatDisabled ? undefined : numUnreadMessages.numUnread
        }
        hasNew={aa.flags.chatDisabled ? false : numUnreadMessages.hasNew}
        accessible={true}
        accessibilityRole="tab"
        accessibilityHint={
          !aa.flags.chatDisabled && numUnreadMessages.count > 0
            ? numUnreadMessages.numUnread?.includes('+')
              ? l({
                  message: `${numUnreadMessages.numUnread} unread items`,
                  comment:
                    'Accessibility hint for the Messages tab when the number of unread messages exceeds the cap, with the + symbol already included – for example, 99+ unread items',
                })
              : l({
                  message: plural(numUnreadMessages.numUnread ?? 0, {
                    one: '# unread item',
                    other: '# unread items',
                  }),
                })
            : ''
        }
      />
      <Btn
        testID="profileBarLibraryBtn"
        label={l({message: 'Library', context: 'profile bar tab'})}
        isActive={isAtLibrary}
        icon={
          <TabIcon
            isActive={isAtLibrary}
            Icon={Bookmark}
            ActiveIcon={BookmarkFilled}
          />
        }
        onPress={() => onPressTab('Library')}
        accessibilityRole="tab"
        accessibilityHint={l`Your saved posts, feeds and lists`}
      />
      <Btn
        testID="profileBarSettingsBtn"
        label={l({message: 'Settings', context: 'profile bar tab'})}
        isActive={isAtSettings}
        icon={
          <TabIcon
            isActive={isAtSettings}
            Icon={Settings}
            ActiveIcon={SettingsFilled}
          />
        }
        notificationCount={settingsCount}
        onPress={() => onPressTab('Settings')}
        accessibilityRole="tab"
        accessibilityHint=""
      />
      <Btn
        testID="profileBarSwitchBtn"
        label={l({message: 'Switch', context: 'profile bar, switch account'})}
        isActive={false}
        icon={
          <TabIcon isActive={false} Icon={SwitchIcon} ActiveIcon={SwitchIcon} />
        }
        onPress={onPressSwitch}
        accessibilityRole="button"
        accessibilityHint={l`Shows other accounts you can switch to`}
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

function MessagesTabMenu({control}: {control: Menu.MenuControlProps}) {
  const {t: l} = useLingui()

  const {mutate: markAllChatsRead} = useUpdateAllRead('accepted', {
    onMutate: () => {
      Toast.show(l`Marked all chats as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all chats as read`, {type: 'error'})
    },
  })

  const {mutate: markAllRequestsRead} = useUpdateAllRead('request', {
    onMutate: () => {
      Toast.show(l`Marked all requests as read`, {type: 'success'})
    },
    onError: () => {
      Toast.show(l`Failed to mark all requests as read`, {type: 'error'})
    },
  })

  return (
    <Menu.Root control={control}>
      <Menu.Outer showCancel>
        <Menu.Group>
          <Menu.Item
            label={l`Mark all chats as read`}
            onPress={() => markAllChatsRead()}>
            <Menu.ItemIcon icon={CircleCheckIcon} />
            <Menu.ItemText>
              <Trans>Mark all chats as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
          <Menu.Item
            label={l`Mark all requests as read`}
            onPress={() => markAllRequestsRead()}>
            <Menu.ItemIcon icon={InboxIcon} />
            <Menu.ItemText>
              <Trans>Mark all requests as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
