import {useState} from 'react'
import {
  Alert,
  type GestureResponderEvent,
  LayoutAnimation,
  View,
} from 'react-native'
import {useReducedMotion} from 'react-native-reanimated'
import {removeNuxs} from '@bsky/sdk'
import {moderateProfile} from '@bsky/sdk/moderation'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useApplyPullRequestOTAUpdate} from '#/lib/hooks/useOTAUpdates'
import {
  getHomeNavigationAction,
  getTabNavigationAction,
} from '#/lib/routes/navigation'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import * as persisted from '#/state/persisted'
import {clearStorage} from '#/state/persisted'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useDeleteActorDeclaration} from '#/state/queries/messages/actor-declaration'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import {useProfileQuery} from '#/state/queries/profile'
import {usePdsClient, useSession, useSessionApi} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AgeAssuranceDismissibleNotice} from '#/components/ageAssurance/AgeAssuranceDismissibleNotice'
import {Button, ButtonText} from '#/components/Button'
import {Bell_Stroke2_Corner0_Rounded as NotificationIcon} from '#/components/icons/Bell'
import {CircleQuestion_Stroke2_Corner2_Rounded as CircleQuestionIcon} from '#/components/icons/CircleQuestion'
import {CodeBrackets_Stroke2_Corner2_Rounded as CodeBracketsIcon} from '#/components/icons/CodeBrackets'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {PaintRoller_Stroke2_Corner2_Rounded as PaintRollerIcon} from '#/components/icons/PaintRoller'
import {Person_Stroke2_Corner2_Rounded as PersonIcon} from '#/components/icons/Person'
import {Posts_Stroke2_Corner2_Rounded as PostsIcon} from '#/components/icons/Posts'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import * as Layout from '#/components/Layout'
import {ID as PolicyUpdate202508} from '#/components/PolicyUpdateOverlay/updates/202508/config'
import {ProfileBadges} from '#/components/ProfileBadges'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_INTERNAL, IS_IOS, IS_NATIVE} from '#/env'
import {useActorStatus} from '#/features/liveNow'
import {type app} from '#/lexicons'
import {device, useStorage} from '#/storage'
import {useActivitySubscriptionsNudged} from '#/storage/hooks/activity-subscriptions-nudged'
import {ItemTextWithSubtitle} from './NotificationSettings/components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Settings'>
export function SettingsScreen({}: Props) {
  const {t: l} = useLingui()
  const unreadCount = useModerationInboxBadgeCount()
  const reducedMotion = useReducedMotion()
  const {logoutEveryAccount} = useSessionApi()
  const {currentAccount} = useSession()
  const signOutPromptControl = Prompt.usePromptControl()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const [showDevOptions, setShowDevOptions] = useState(false)

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <BackToProfileButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <AgeAssuranceDismissibleNotice style={[a.px_lg, a.pt_xs, a.pb_xl]} />

          <View
            style={[
              a.px_xl,
              a.pt_md,
              a.pb_md,
              a.w_full,
              a.gap_2xs,
              a.align_center,
              {minHeight: 160},
            ]}>
            {profile && <ProfilePreview profile={profile} />}
          </View>
          <SettingsList.Divider />
          <SectionLink
            to="/settings/account"
            icon={PersonIcon}
            title={l`Account`}
            summary={l`Email, password, handle, 2FA, export, delete`}
          />
          <SectionLink
            to="/settings/privacy-and-safety"
            icon={ShieldIcon}
            title={l`Privacy and safety`}
            summary={l`Muted words, blocks, content filters`}
            count={unreadCount}
          />
          <SectionLink
            to="/settings/notifications"
            icon={NotificationIcon}
            title={l`Notifications`}
            summary={l`Push, comments, quotes, messages`}
          />
          <SectionLink
            to="/settings/content-and-media"
            icon={PostsIcon}
            title={l`Feeds and content`}
            summary={l`Posts, news, media, languages`}
          />
          <SectionLink
            to="/settings/appearance"
            icon={PaintRollerIcon}
            title={l`Look and feel`}
            summary={l`Theme, accessibility, companion`}
          />
          <SectionLink
            to="/settings/about"
            icon={CircleQuestionIcon}
            title={l`Help and about`}
            summary={l`Help, feedback, donate, legal, advanced`}
          />
          <SettingsList.Divider />
          <SettingsList.PressableItem
            destructive
            onPress={() => signOutPromptControl.open()}
            label={l`Sign out`}>
            <SettingsList.ItemText>
              <Trans>Sign out</Trans>
            </SettingsList.ItemText>
          </SettingsList.PressableItem>
          {IS_INTERNAL && (
            <>
              <SettingsList.Divider />
              <SettingsList.PressableItem
                onPress={() => {
                  if (!reducedMotion) {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    )
                  }
                  setShowDevOptions(d => !d)
                }}
                label={l`Developer options`}>
                <SettingsList.ItemIcon icon={CodeBracketsIcon} />
                <SettingsList.ItemText>
                  <Trans>Developer options</Trans>
                </SettingsList.ItemText>
              </SettingsList.PressableItem>
              {showDevOptions && <DevOptions />}
            </>
          )}
        </SettingsList.Container>
      </Layout.Content>

      <Prompt.Basic
        control={signOutPromptControl}
        title={l`Sign out?`}
        description={l`You will be signed out of all your accounts.`}
        onConfirm={() => logoutEveryAccount('Settings')}
        confirmButtonCta={l`Sign out`}
        cancelButtonCta={l`Cancel`}
        confirmButtonColor="negative"
      />
    </Layout.Screen>
  )
}

function ProfilePreview({
  profile,
}: {
  profile: app.bsky.actor.defs.ProfileViewDetailed
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const shadow = useProfileShadow(profile)
  const moderationOpts = useModerationOpts()
  const {isActive: live} = useActorStatus(profile)

  if (!moderationOpts) return null

  const moderation = moderateProfile(profile, moderationOpts)
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  return (
    <>
      <UserAvatar
        size={80}
        avatar={shadow.avatar}
        moderation={moderation.ui('avatar')}
        type={shadow.associated?.labeler ? 'labeler' : 'user'}
        live={live}
      />

      <View
        style={[
          a.flex_row,
          a.gap_xs,
          a.align_center,
          a.justify_center,
          a.w_full,
          a.pt_sm,
        ]}>
        <Text
          emoji
          testID="profileHeaderDisplayName"
          numberOfLines={1}
          style={[
            t.atoms.text,
            gtMobile ? a.text_4xl : a.text_3xl,
            a.font_bold,
          ]}>
          {displayName}
        </Text>
        <ProfileBadges profile={shadow} size="xl" interactive />
      </View>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
        {sanitizeHandle(profile.handle, '@')}
      </Text>
    </>
  )
}

function DevOptions() {
  const {t: l} = useLingui()
  const pdsClient = usePdsClient()
  const [override, setOverride] = useStorage(device, [
    'policyUpdateDebugOverride',
  ])
  const onboardingDispatch = useOnboardingDispatch()
  const navigation = useNavigation<NavigationProp>()
  const {mutate: deleteChatDeclarationRecord} = useDeleteActorDeclaration()
  const {
    tryApplyUpdate,
    restoreDefaultChannel,
    isCurrentlyRunningPullRequestDeployment,
    currentChannel,
  } = useApplyPullRequestOTAUpdate()
  const [actyNotifNudged, setActyNotifNudged] = useActivitySubscriptionsNudged()

  const resetOnboarding = () => {
    navigation.dispatch(
      getHomeNavigationAction(navigation.getState(), 'navigate'),
    )
    onboardingDispatch({type: 'start'})
    Toast.show(l`Onboarding reset`)
  }

  const clearAllStorage = async () => {
    await clearStorage()
    Toast.show(l`Storage cleared, you need to restart the app now.`)
  }

  const onPressUnsnoozeReminder = () => {
    const lastEmailConfirm = new Date()
    // wind back 3 days
    lastEmailConfirm.setDate(lastEmailConfirm.getDate() - 3)
    void persisted.write('reminders', {
      ...persisted.get('reminders'),
      lastEmailConfirm: lastEmailConfirm.toISOString(),
    })
    Toast.show(l`You probably want to restart the app now.`)
  }

  const onPressActySubsUnNudge = () => {
    setActyNotifNudged(false)
  }

  const onPressApplyOta = () => {
    Alert.prompt(
      'Apply OTA',
      'Enter the channel for the OTA you wish to apply.',
      [
        {
          style: 'cancel',
          text: 'Cancel',
        },
        {
          style: 'default',
          text: 'Apply',
          onPress: (channel?: string) => {
            void tryApplyUpdate(channel ?? '')
          },
        },
      ],
      'plain-text',
      isCurrentlyRunningPullRequestDeployment
        ? currentChannel
        : 'pull-request-',
    )
  }

  return (
    <>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('Log')}
        label={l`Open system log`}>
        <SettingsList.ItemText>
          <Trans>System log</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('Debug')}
        label={l`Open storybook page`}>
        <SettingsList.ItemText>
          <Trans>Storybook</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => navigation.navigate('DebugMod')}
        label={l`Open moderation debug page`}>
        <SettingsList.ItemText>
          <Trans>Debug Moderation</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => deleteChatDeclarationRecord()}
        label={l`Delete chat declaration record`}>
        <SettingsList.ItemText>
          <Trans>Delete chat declaration record</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={() => void resetOnboarding()}
        label={l`Reset onboarding state`}>
        <SettingsList.ItemText>
          <Trans>Reset onboarding state</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      <SettingsList.PressableItem
        onPress={onPressUnsnoozeReminder}
        label={l`Unsnooze email reminder`}>
        <SettingsList.ItemText>
          <Trans>Unsnooze email reminder</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      {actyNotifNudged && (
        <SettingsList.PressableItem
          onPress={onPressActySubsUnNudge}
          label={l`Reset activity subscription nudge`}>
          <SettingsList.ItemText>
            <Trans>Reset activity subscription nudge</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      )}
      <SettingsList.PressableItem
        onPress={() => void clearAllStorage()}
        label={l`Clear all storage data`}>
        <SettingsList.ItemText>
          <Trans>Clear all storage data (restart after this)</Trans>
        </SettingsList.ItemText>
      </SettingsList.PressableItem>
      {IS_IOS ? (
        <SettingsList.PressableItem
          onPress={onPressApplyOta}
          label={l`Apply Pull Request`}>
          <SettingsList.ItemText>
            <Trans>Apply Pull Request</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      ) : null}
      {IS_NATIVE && isCurrentlyRunningPullRequestDeployment ? (
        <SettingsList.PressableItem
          onPress={() => void restoreDefaultChannel()}
          label={l`Unapply Pull Request`}>
          <SettingsList.ItemText>
            <Trans>Unapply Pull Request {currentChannel}</Trans>
          </SettingsList.ItemText>
        </SettingsList.PressableItem>
      ) : null}
      <SettingsList.Divider />
      <View style={[a.p_xl, a.gap_md]}>
        <Text style={[a.text_lg, a.font_semi_bold]}>
          PolicyUpdate202508 Debug
        </Text>

        <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_md]}>
          <Button
            onPress={() => {
              setOverride(!override)
            }}
            label="Toggle"
            color={override ? 'primary' : 'secondary'}
            size="small"
            style={[a.flex_1]}>
            <ButtonText>
              {override ? 'Disable debug mode' : 'Enable debug mode'}
            </ButtonText>
          </Button>

          <Button
            onPress={() => {
              device.set([PolicyUpdate202508], false)
              void pdsClient.call(removeNuxs, [PolicyUpdate202508])
              Toast.show(`Done`, {
                type: 'info',
              })
            }}
            label="Reset policy update nux"
            color="secondary"
            size="small"
            disabled={!override}>
            <ButtonText>Reset state</ButtonText>
          </Button>
        </View>
      </View>
      <SettingsList.Divider />
    </>
  )
}

/**
 * A top-level Settings section: icon, title and a one-line summary of what
 * is inside.
 */
function SectionLink({
  to,
  icon,
  title,
  summary,
  count = 0,
}: {
  to: string
  icon: React.ComponentType<SVGIconProps>
  title: string
  summary: string
  count?: number
}) {
  return (
    <SettingsList.LinkItem
      to={to}
      label={title}
      accessibilityHint={summary}
      contentContainerStyle={[a.align_center]}>
      <SettingsList.ItemIcon icon={icon} />
      <ItemTextWithSubtitle titleText={title} subtitleText={summary} />
      <SettingsList.BadgeCount count={count} />
    </SettingsList.LinkItem>
  )
}

/**
 * Settings opens from your profile, so back goes there when there is nothing
 * to go back to in this stack.
 */
function BackToProfileButton() {
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
