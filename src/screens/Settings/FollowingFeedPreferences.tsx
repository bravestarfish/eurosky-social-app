import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {
  usePreferencesQuery,
  useSetFeedViewPreferencesMutation,
} from '#/state/queries/preferences'
import {atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Beaker_Stroke2_Corner2_Rounded as BeakerIcon} from '#/components/icons/Beaker'
import {Bubbles_Stroke2_Corner2_Rounded as BubblesIcon} from '#/components/icons/Bubble'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as RepostIcon} from '#/components/icons/Repost'
import * as SettingsList from './components/SettingsList'

/**
 * What the Following feed shows. Part of Settings > Feeds and content.
 */
export function FollowingFeedPreferencesGroup() {
  const {_} = useLingui()

  const {data: preferences} = usePreferencesQuery()
  const {mutate: setFeedViewPref, variables} =
    useSetFeedViewPreferencesMutation()

  const showReplies = !(
    variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies
  )

  const showReposts = !(
    variables?.hideReposts ?? preferences?.feedViewPrefs?.hideReposts
  )

  const showQuotePosts = !(
    variables?.hideQuotePosts ?? preferences?.feedViewPrefs?.hideQuotePosts
  )

  const mergeFeedEnabled = Boolean(
    variables?.lab_mergeFeedEnabled ??
    preferences?.feedViewPrefs?.lab_mergeFeedEnabled,
  )

  return (
    <>
      <Toggle.Item
        type="checkbox"
        name="show-replies"
        label={_(msg`Show replies`)}
        value={showReplies}
        onChange={value =>
          setFeedViewPref({
            hideReplies: !value,
          })
        }>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={BubblesIcon} />
          <SettingsList.ItemText>
            <Trans>Show replies</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        type="checkbox"
        name="show-reposts"
        label={_(msg`Show reposts`)}
        value={showReposts}
        onChange={value =>
          setFeedViewPref({
            hideReposts: !value,
          })
        }>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={RepostIcon} />
          <SettingsList.ItemText>
            <Trans>Show reposts</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <Toggle.Item
        type="checkbox"
        name="show-quotes"
        label={_(msg`Show quote posts`)}
        value={showQuotePosts}
        onChange={value =>
          setFeedViewPref({
            hideQuotePosts: !value,
          })
        }>
        <SettingsList.Item>
          <SettingsList.ItemIcon icon={QuoteIcon} />
          <SettingsList.ItemText>
            <Trans>Show quote posts</Trans>
          </SettingsList.ItemText>
          <Toggle.Platform />
        </SettingsList.Item>
      </Toggle.Item>
      <SettingsList.Divider />
      <SettingsList.Group>
        <SettingsList.ItemIcon icon={BeakerIcon} />
        <SettingsList.ItemText>
          <Trans>Experimental</Trans>
        </SettingsList.ItemText>
        <Toggle.Item
          type="checkbox"
          name="merge-feed"
          label={_(
            msg`Show samples of your saved feeds in your Following feed`,
          )}
          value={mergeFeedEnabled}
          onChange={value =>
            setFeedViewPref({
              lab_mergeFeedEnabled: value,
            })
          }
          style={[a.w_full, a.gap_md]}>
          <Toggle.LabelText style={[a.flex_1]}>
            <Trans>
              Show samples of your saved feeds in your Following feed
            </Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
      </SettingsList.Group>
    </>
  )
}
