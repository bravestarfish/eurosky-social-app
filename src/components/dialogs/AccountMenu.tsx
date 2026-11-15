import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useAccountSwitcher} from '#/lib/hooks/useAccountSwitcher'
import {getTabNavigationAction} from '#/lib/routes/navigation'
import {type ProfileNavTab, TAB_TO_NAV_ITEM} from '#/lib/routes/tab-to-nav-item'
import {type NavigationProp} from '#/lib/routes/types'
import {useUnreadMessageCount} from '#/state/queries/messages/list-conversations'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import {type SessionAccount, useSession} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Bookmark_Stroke2_Corner0_Rounded as BookmarkIcon} from '#/components/icons/Bookmark'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon} from '#/components/icons/Chevron'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/Settings'
import {useAgeAssurance} from '#/ageAssurance'
import {useAnalytics} from '#/analytics'
import {AccountList} from '../AccountList'
import {Text} from '../Typography'

/**
 * The menu behind the Profile tab: your accounts (yours opens your profile,
 * others switch to them), Add account, then Messages, Library and Settings.
 * Opened by long-pressing the Profile tab, or tapping it on your own profile.
 */
export function AccountMenuDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  const {t: l} = useLingui()
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Account menu`}>
        <AccountMenuContent onClose={then => control.close(then)} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

/**
 * The menu's rows, shared by the dialog (apps) and the popover (mobile web).
 * `onClose` closes the container and then runs `then`, so navigation happens
 * after the close animation.
 */
export function AccountMenuContent({
  onClose,
}: {
  onClose: (then?: () => void) => void
}) {
  const {t: l, i18n} = useLingui()
  const ax = useAnalytics()
  const aa = useAgeAssurance()
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()
  const {onPressSwitchAccount, pendingDid} = useAccountSwitcher()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const unreadMessages = useUnreadMessageCount()
  const moderationInboxCount = useModerationInboxBadgeCount()

  const onSelectAccount = (account: SessionAccount) => {
    if (account.did !== currentAccount?.did) {
      onClose(() => {
        void onPressSwitchAccount(account, 'SwitchAccount')
      })
    } else {
      onClose(() => {
        navigation.dispatch(
          getTabNavigationAction('MyProfile', currentAccount?.handle),
        )
      })
    }
  }

  const onPressAddAccount = () => {
    onClose(() => {
      setShowLoggedOut(true)
    })
  }

  const open = (tab: ProfileNavTab) => {
    ax.metric('nav:click', {
      item: TAB_TO_NAV_ITEM[tab],
      surface: 'accountMenu',
    })
    onClose(() => {
      navigation.dispatch(getTabNavigationAction(tab, currentAccount?.handle))
    })
  }

  return (
    <View style={[a.gap_lg]}>
      <AccountList
        onSelectAccount={onSelectAccount}
        onSelectOther={onPressAddAccount}
        otherLabel={l`Add account`}
        pendingDid={pendingDid}
      />
      <MenuGroup>
        {!aa.flags.chatDisabled && (
          <MenuRow
            testID="accountMenuMessages"
            label={l`Messages`}
            icon={MessageIcon}
            count={
              unreadMessages.count > 0 ? unreadMessages.numUnread : undefined
            }
            onPress={() => open('Messages')}
          />
        )}
        <MenuRow
          testID="accountMenuLibrary"
          label={l`Library`}
          icon={BookmarkIcon}
          onPress={() => open('Library')}
        />
        <MenuRow
          testID="accountMenuSettings"
          label={l`Settings`}
          icon={SettingsIcon}
          count={
            moderationInboxCount > 0
              ? i18n.number(moderationInboxCount)
              : undefined
          }
          onPress={() => open('Settings')}
          last
        />
      </MenuGroup>
    </View>
  )
}

function MenuGroup({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.rounded_lg,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      {children}
    </View>
  )
}

function MenuRow({
  testID,
  label,
  icon: Icon,
  count,
  onPress,
  last = false,
}: {
  testID: string
  label: string
  icon: React.ComponentType<SVGIconProps>
  count?: string
  onPress: () => void
  last?: boolean
}) {
  const t = useTheme()
  return (
    <Button testID={testID} style={[a.w_full]} label={label} onPress={onPress}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.px_lg,
            a.py_md,
            a.gap_md,
            !last && [a.border_b, t.atoms.border_contrast_low],
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <Icon size="md" style={[t.atoms.text]} />
          <Text style={[a.flex_1, a.text_md, a.font_medium, a.leading_tight]}>
            {label}
          </Text>
          {count ? (
            <View
              style={[
                a.rounded_full,
                a.px_sm,
                {paddingVertical: 2, backgroundColor: t.palette.primary_500},
              ]}>
              <Text style={[a.text_xs, a.font_bold, {color: 'white'}]}>
                {count}
              </Text>
            </View>
          ) : null}
          <ChevronIcon size="md" style={[t.atoms.text_contrast_low]} />
        </View>
      )}
    </Button>
  )
}
