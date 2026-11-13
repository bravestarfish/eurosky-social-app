import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {UNREAD_NOTIFICATION_CAP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {getTabNavigationAction} from '#/lib/routes/navigation'
import {type ProfileNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {type NavigationProp} from '#/lib/routes/types'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {MessagesMenu} from '#/components/dms/MessagesMenu'
import {Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon} from '#/components/icons/Bookmark'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'

/**
 * Icon shortcuts to Messages, Library and Settings, shown under Edit profile
 * on your own profile at phone width. Wider layouts have them in the sidebar.
 */
export function ProfileShortcuts() {
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const haptics = useHaptics()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const unreadMessages = useUnreadMessageCount()
  const moderationInboxCount = useModerationInboxBadgeCount()
  const messagesMenuControl = Menu.useMenuControl()

  const open = (tab: ProfileNavTab) => {
    haptics.tap()
    ax.metric('nav:click', {
      item: TAB_TO_NAV_ITEM[tab],
      surface: 'profileHeader',
    })
    navigation.dispatch(getTabNavigationAction(tab, currentAccount?.handle))
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
    <View
      style={[a.flex_row, a.justify_end, a.gap_sm, a.pb_sm]}
      testID="profileShortcuts">
      {!aa.flags.chatDisabled && (
        <>
          <Shortcut
            testID="profileShortcutMessages"
            label={l`Messages`}
            hint={
              unreadMessages.count > 0
                ? l`You have unread messages. Long-press for more options.`
                : l`Long-press for more options.`
            }
            icon={MessageIcon}
            count={unreadMessages.numUnread}
            hasNew={unreadMessages.hasNew}
            onPress={() => open('Messages')}
            onLongPress={() => {
              haptics.longPress()
              messagesMenuControl.open()
            }}
          />
          <MessagesMenu control={messagesMenuControl} />
        </>
      )}
      <Shortcut
        testID="profileShortcutLibrary"
        label={l`Library`}
        hint={l`Your saved posts, feeds and lists`}
        icon={BookmarkIcon}
        onPress={() => open('Library')}
      />
      <Shortcut
        testID="profileShortcutSettings"
        label={l`Settings`}
        icon={SettingsIcon}
        count={settingsCount}
        onPress={() => open('Settings')}
      />
    </View>
  )
}

function Shortcut({
  testID,
  label,
  hint,
  icon,
  count,
  hasNew = false,
  onPress,
  onLongPress,
}: {
  testID: string
  label: string
  hint?: string
  icon: React.ComponentType<SVGIconProps>
  /** Shown as a pill; takes precedence over `hasNew`. */
  count?: string
  /** Shown as a dot. */
  hasNew?: boolean
  onPress: () => void
  onLongPress?: () => void
}) {
  const t = useTheme()
  return (
    <View>
      <Button
        testID={testID}
        label={label}
        accessibilityHint={hint}
        size="small"
        color="secondary"
        shape="round"
        // expand the 33pt button toward a 44pt touch target
        hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}
        onPress={onPress}
        onLongPress={onLongPress}>
        <ButtonIcon icon={icon} />
      </Button>
      {count ? (
        <View
          pointerEvents="none"
          style={[
            a.absolute,
            a.rounded_full,
            a.align_center,
            a.justify_center,
            {
              top: -6,
              right: -8,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderWidth: 2,
              borderColor: t.atoms.bg.backgroundColor,
              backgroundColor: t.palette.primary_500,
            },
          ]}>
          <Text
            maxFontSizeMultiplier={1.3}
            style={[
              a.font_bold,
              {fontSize: 10, lineHeight: 12, color: 'white'},
            ]}>
            {count}
          </Text>
        </View>
      ) : hasNew ? (
        <View
          pointerEvents="none"
          style={[
            a.absolute,
            a.rounded_full,
            {
              top: -1,
              right: -1,
              width: 10,
              height: 10,
              borderWidth: 2,
              borderColor: t.atoms.bg.backgroundColor,
              backgroundColor: t.palette.primary_500,
            },
          ]}
        />
      ) : null}
    </View>
  )
}
