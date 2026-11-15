import {useCallback, useEffect} from 'react'
import {Pressable, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigationState} from '@react-navigation/native'

import {useHideBottomBarBorder} from '#/lib/hooks/useHideBottomBarBorder'
import {useMinimalShellFooterTransform} from '#/lib/hooks/useMinimalShellTransform'
import {getCurrentRoute, isTab, SECONDARY_TABS} from '#/lib/routes/helpers'
import {makeProfileLink} from '#/lib/routes/links'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useHomeBadge} from '#/state/home-badge'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import {useUnreadNotifications} from '#/state/queries/notifications/unread'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useCloseAllActiveElements} from '#/state/util'
import {Link} from '#/view/com/util/Link'
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
import {NEWS_V2_ENABLED} from '#/features/newsFeed/config'
import {styles} from './BottomBarStyles'
import {isProfileSpaceRoute} from './profileSpace'

type NavItemValue =
  | 'home'
  | 'news'
  | 'search'
  | 'notifications'
  | 'profile'
  | 'messages'
  | 'library'
  | 'settings'

const ICON_WIDTH = 26

export function BottomBarWeb() {
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const t = useTheme()
  // Eurosky fork: pad the bottom bar past the iOS home indicator when running
  // as a standalone PWA (env(safe-area-inset-bottom)); 0 in a browser tab.
  const insets = useSafeAreaInsets()
  const footerMinimalShellTransform = useMinimalShellFooterTransform()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()
  const {footerHeight} = useShellLayout()
  // The bottom bar is only mounted on mobile/tablet web. When the viewport
  // grows to desktop (or on first paint before breakpoints resolve) it
  // unmounts, but onLayout never fires to clear the height it measured. Reset
  // it so things pinned to the footer (e.g. the cat companion) drop back to the
  // real bottom of the screen.
  useEffect(() => {
    return () => footerHeight.set(0)
  }, [footerHeight])
  const hideBorder = useHideBottomBarBorder()
  const accountMenuControl = useDialogControl()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const iconWidth = ICON_WIDTH
  const moderationInboxCount = useModerationInboxBadgeCount()

  const unreadMessageCount = useUnreadMessageCount()
  const notificationCountStr = useUnreadNotifications()
  const hasHomeBadge = useHomeBadge()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const isLabeler = profile?.associated?.labeler
  const hasUnreadMessages =
    !aa.flags.chatDisabled && unreadMessageCount.count > 0

  const showSignIn = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  const showCreateAccount = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'new'})
    // setShowLoggedOut(true)
  }, [requestSwitchToAccount, closeAllActiveElements])

  const onOpenAccountMenu = useCallback(() => {
    accountMenuControl.open()
  }, [accountMenuControl])

  return (
    <>
      <AccountMenuDialog control={accountMenuControl} />

      <Animated.View
        role="navigation"
        style={[
          styles.bottomBar,
          styles.bottomBarWeb,
          t.atoms.bg,
          {paddingBottom: insets.bottom},
          hideBorder
            ? {borderColor: t.atoms.bg.backgroundColor}
            : t.atoms.border_contrast_low,
          footerMinimalShellTransform,
        ]}
        onLayout={event => footerHeight.set(event.nativeEvent.layout.height)}>
        {hasSession ? (
          <>
            <NavItem
              routeName="Home"
              href="/"
              navItem="home"
              label={_(msg({message: 'Home', context: 'bottom bar tab'}))}
              hasNew={hasHomeBadge && isFollowingV2HomeDotEnabled(ax)}>
              {({isActive}) => (
                <TabIcon
                  isActive={isActive}
                  Icon={isActive ? HomeFilled : Home}
                />
              )}
            </NavItem>
            <NavItem
              routeName={SECONDARY_TABS.News.rootRoute}
              href={NEWS_V2_ENABLED ? '/news/explore' : '/news'}
              navItem="news"
              label={_(msg({message: 'News', context: 'bottom bar tab'}))}>
              {({isActive}) => (
                <TabIcon
                  isActive={isActive}
                  Icon={isActive ? NewspaperFilled : Newspaper}
                />
              )}
            </NavItem>
            <NavItem
              routeName="Search"
              href="/search"
              navItem="search"
              label={_(msg({message: 'Search', context: 'bottom bar tab'}))}>
              {({isActive}) => (
                <TabIcon
                  isActive={isActive}
                  Icon={isActive ? MagnifyingGlassFilled : MagnifyingGlass}
                />
              )}
            </NavItem>
            <NavItem
              routeName="Notifications"
              href="/notifications"
              navItem="notifications"
              label={_(
                msg({
                  message: 'Notifications',
                  context: 'bottom bar tab',
                  comment:
                    'Bottom bar tab label. Space is tight, so use a short word if your language has one, e.g. "Alerts".',
                }),
              )}
              notificationCount={notificationCountStr}>
              {({isActive}) => (
                <TabIcon
                  isActive={isActive}
                  Icon={isActive ? BellFilled : Bell}
                />
              )}
            </NavItem>
            <NavItem
              routeName="Profile"
              href={
                currentAccount
                  ? makeProfileLink({
                      did: currentAccount.did,
                      handle: currentAccount.handle,
                    })
                  : '/'
              }
              navItem="profile"
              label={_(msg({message: 'Profile', context: 'bottom bar tab'}))}
              hasNew={hasUnreadMessages || moderationInboxCount > 0}
              onLongPress={onOpenAccountMenu}
              onPressOnOwnProfile={onOpenAccountMenu}>
              {({isActive}) => (
                <View style={styles.ctrlIconSizingWrapper}>
                  <View
                    style={[
                      styles.ctrlIcon,
                      isLabeler ? styles.profileIconSquare : styles.profileIcon,
                      isActive && [
                        isLabeler ? styles.onProfileSquare : styles.onProfile,
                        {
                          borderColor: t.palette.primary_500,
                          borderWidth: 2,
                        },
                      ],
                    ]}>
                    <UserAvatar
                      avatar={profile?.avatar}
                      size={iconWidth - (isActive ? 4 : 2)}
                      type={profile?.associated?.labeler ? 'labeler' : 'user'}
                    />
                  </View>
                </View>
              )}
            </NavItem>
          </>
        ) : (
          <>
            <View
              style={[
                a.w_full,
                a.flex_row,
                a.align_center,
                a.justify_between,
                a.gap_sm,
                {
                  paddingTop: 14,
                  paddingBottom: 14,
                  paddingLeft: 14,
                  paddingRight: 6,
                },
              ]}>
              <View style={[a.flex_row, a.align_center, a.gap_md]}>
                <View style={{paddingTop: 4}}>
                  <Logotype width={44} fill={t.atoms.text.color} />
                </View>
              </View>

              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                <Button
                  onPress={showCreateAccount}
                  label={_(msg`Create account`)}
                  size="small"
                  variant="solid"
                  color="primary">
                  <ButtonText>
                    <Trans>Create account</Trans>
                  </ButtonText>
                </Button>
                <Button
                  onPress={showSignIn}
                  label={_(msg`Sign in`)}
                  size="small"
                  variant="solid"
                  color="secondary">
                  <ButtonText>
                    <Trans>Sign in</Trans>
                  </ButtonText>
                </Button>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </>
  )
}

function TabIcon({
  isActive,
  Icon,
}: {
  isActive: boolean
  Icon: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  return (
    <Icon
      aria-hidden={true}
      width={ICON_WIDTH}
      fill={
        isActive ? t.palette.primary_500 : t.atoms.text_contrast_medium.color
      }
      style={styles.ctrlIcon}
    />
  )
}

function TabLabel({isActive, label}: {isActive: boolean; label: string}) {
  const t = useTheme()
  return (
    <Text
      numberOfLines={1}
      style={[
        styles.ctrlLabel,
        isActive
          ? {color: t.palette.primary_500}
          : t.atoms.text_contrast_medium,
      ]}>
      {label}
    </Text>
  )
}

function NavItem({
  children,
  href,
  routeName,
  navItem,
  label,
  hasNew,
  notificationCount,
  onLongPress,
  onPressOnOwnProfile,
}: {
  children: (props: {isActive: boolean}) => React.ReactNode
  href: string
  routeName: string
  navItem: NavItemValue
  label: string
  hasNew?: boolean
  notificationCount?: string
  onLongPress?: () => void
  /** On your own profile a tap has nowhere new to go, so it does this. */
  onPressOnOwnProfile?: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const ax = useAnalytics()
  const {currentAccount} = useSession()
  const currentRoute = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })

  const onBeforePress = useCallback(() => {
    ax.metric('nav:click', {item: navItem, surface: 'bottomBar'})
  }, [ax, navItem])

  // Checks whether we're on someone else's profile
  const isOnDifferentProfile =
    currentRoute.name === 'Profile' &&
    routeName === 'Profile' &&
    (currentRoute.params as CommonNavigatorParams['Profile']).name !==
      currentAccount?.handle

  const isActive =
    currentRoute.name === 'Profile'
      ? isTab(currentRoute.name, routeName) &&
        (currentRoute.params as CommonNavigatorParams['Profile']).name ===
          (routeName === 'Profile'
            ? currentAccount?.handle
            : (currentRoute.params as CommonNavigatorParams['Profile']).name)
      : isTab(currentRoute.name, routeName) ||
        // Messages, Library and Settings open from your profile.
        (routeName === 'Profile' && isProfileSpaceRoute(currentRoute.name))

  const isOnOwnProfile =
    currentRoute.name === 'Profile' &&
    (currentRoute.params as CommonNavigatorParams['Profile']).name ===
      currentAccount?.handle
  const content = (
    <>
      {children({isActive})}
      <TabLabel isActive={isActive} label={label} />
      {notificationCount ? (
        <View
          style={[
            styles.notificationCount,
            styles.notificationCountWeb,
            {backgroundColor: t.palette.primary_500},
          ]}
          aria-label={_(
            msg`${plural(notificationCount, {
              one: '# unread item',
              other: '# unread items',
            })}`,
          )}>
          <Text style={styles.notificationCountLabel}>{notificationCount}</Text>
        </View>
      ) : hasNew ? (
        <View
          style={[styles.hasNewBadge, {backgroundColor: t.palette.primary_500}]}
        />
      ) : null}
    </>
  )

  if (onPressOnOwnProfile && isOnOwnProfile) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={_(
          msg`Opens accounts, messages, library and settings`,
        )}
        onPress={onPressOnOwnProfile}
        onLongPress={onLongPress}
        style={[styles.ctrl, a.pb_lg]}>
        {content}
      </Pressable>
    )
  }

  return (
    <Link
      href={href}
      style={[styles.ctrl, a.pb_lg]}
      navigationAction={isOnDifferentProfile ? 'push' : 'navigate'}
      aria-role="link"
      aria-label={label}
      accessible={true}
      onBeforePress={onBeforePress}
      onLongPress={onLongPress}>
      {content}
    </Link>
  )
}
