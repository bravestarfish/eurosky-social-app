import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useNotificationDeclarationQuery} from '#/state/queries/activity-subscriptions'
import {useModerationInboxBadgeCount} from '#/state/queries/moderation-inbox'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon} from '#/components/icons/EyeSlash'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {RaisingHand4Finger_Stroke2_Corner2_Rounded as HandIcon} from '#/components/icons/RaisingHand'
import {ShieldCheck_Stroke2_Corner0_Rounded as ShieldIcon} from '#/components/icons/Shield'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {BRAND} from '#/config/brand'
import {type app} from '#/lexicons'
import {AlgoVisibilityOptOut} from './components/AlgoVisibilityOptOut'
import {PwiOptOut} from './components/PwiOptOut'
import {ItemTextWithSubtitle} from './NotificationSettings/components/ItemTextWithSubtitle'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PrivacyAndSecuritySettings'
>
export function PrivacyAndSecuritySettingsScreen({}: Props) {
  const {_} = useLingui()
  const moderationInboxCount = useModerationInboxBadgeCount()
  const {
    data: notificationDeclaration,
    isPending,
    isError,
  } = useNotificationDeclarationQuery()

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Privacy and safety</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <SettingsList.Container>
          <SettingsList.GroupHeadingText first>
            <Trans>Moderation</Trans>
          </SettingsList.GroupHeadingText>
          <SettingsList.LinkItem
            to="/moderation"
            label={_(msg`Moderation tools`)}
            contentContainerStyle={[a.align_start]}
            accessibilityHint={
              moderationInboxCount > 0
                ? plural(moderationInboxCount, {
                    one: '# unread update',
                    other: '# unread updates',
                  })
                : undefined
            }>
            <SettingsList.ItemIcon icon={HandIcon} />
            <ItemTextWithSubtitle
              titleText={<Trans>Moderation tools</Trans>}
              subtitleText={
                <Trans>Muted words, blocks, content filters, labelers</Trans>
              }
            />
            <SettingsList.BadgeCount count={moderationInboxCount} />
          </SettingsList.LinkItem>
          <SettingsList.LinkItem
            to="/moderation/verification-settings"
            label={_(msg`Verification`)}>
            <SettingsList.ItemIcon icon={ShieldIcon} />
            <SettingsList.ItemText>
              <Trans>Verification</Trans>
            </SettingsList.ItemText>
          </SettingsList.LinkItem>

          <SettingsList.GroupHeadingText>
            <Trans>Your visibility</Trans>
          </SettingsList.GroupHeadingText>
          <SettingsList.LinkItem
            label={_(
              msg`Settings for allowing others to be notified of your posts`,
            )}
            to={{screen: 'ActivityPrivacySettings'}}
            contentContainerStyle={[a.align_start]}>
            <SettingsList.ItemIcon icon={BellRingingIcon} />
            <ItemTextWithSubtitle
              titleText={
                <Trans>Allow others to be notified of your posts</Trans>
              }
              subtitleText={
                <NotificationDeclaration
                  data={notificationDeclaration}
                  isError={isError}
                />
              }
              showSkeleton={isPending}
            />
          </SettingsList.LinkItem>
          <SettingsList.Item style={[a.align_start]}>
            <SettingsList.ItemIcon icon={MagnifyingGlassIcon} />
            <AlgoVisibilityOptOut />
          </SettingsList.Item>
          <SettingsList.Item style={[a.align_start]}>
            <SettingsList.ItemIcon icon={EyeSlashIcon} />
            <PwiOptOut />
          </SettingsList.Item>
          <SettingsList.Item>
            <Admonition.Outer type="tip" style={[a.flex_1]}>
              <Admonition.Row>
                <Admonition.Icon />
                <Admonition.Content>
                  <Admonition.Text>
                    <Trans>
                      Note: Bluesky is part of the Atmosphere, an open public
                      network. These settings ask other apps and websites to
                      limit your visibility, but they can choose not to. Your
                      public content may still appear elsewhere.
                    </Trans>
                  </Admonition.Text>
                  <Admonition.Text>
                    <InlineLinkText
                      label={_(
                        msg`Learn more about what is public on Bluesky.`,
                      )}
                      to={BRAND.links.dataPrivacy}>
                      <Trans>Learn more about what is public on Bluesky.</Trans>
                    </InlineLinkText>
                  </Admonition.Text>
                </Admonition.Content>
              </Admonition.Row>
            </Admonition.Outer>
          </SettingsList.Item>
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function NotificationDeclaration({
  data,
  isError,
}: {
  data?: {
    value: app.bsky.notification.declaration.Main
  }
  isError?: boolean
}) {
  if (isError) {
    return <Trans>Error loading preference</Trans>
  }
  switch (data?.value?.allowSubscriptions) {
    case 'mutuals':
      return <Trans>Only followers who I follow</Trans>
    case 'none':
      return <Trans context="enable for">No one</Trans>
    case 'followers':
    default:
      return <Trans>Anyone who follows me</Trans>
  }
}
