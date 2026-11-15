import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, platform, useTheme} from '#/alf'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {PROFILE_TAB_KEYS, type ProfileTabKey} from './tabs'

/**
 * Checkboxes for which tabs show on your profile, in Edit profile under
 * Links. At least one stays ticked.
 */
export function ProfileTabsEditor({
  values,
  onChange,
  disabled = false,
}: {
  values: ProfileTabKey[]
  onChange: (values: string[]) => void
  disabled?: boolean
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const labels: Record<ProfileTabKey, string> = {
    posts: l({message: 'Posts', context: 'profile tab'}),
    replies: l({message: 'Replies', context: 'profile tab'}),
    media: l({message: 'Media', context: 'profile tab'}),
    likes: l({message: 'Likes', context: 'profile tab'}),
    feeds: l({message: 'Feeds', context: 'profile tab'}),
    starterPacks: l({message: 'Starter Packs', context: 'profile tab'}),
    lists: l({message: 'Lists', context: 'profile tab'}),
  }

  return (
    <View style={[a.gap_sm]}>
      <TextField.LabelText>
        <Trans>Show on your profile</Trans>
      </TextField.LabelText>
      <Toggle.Group
        label={l`Tabs to show on your profile`}
        values={values}
        disabled={disabled}
        onChange={next => {
          // keep at least one tab, so the profile is never empty
          if (next.length > 0) onChange(next)
        }}>
        <View style={[a.gap_xs]}>
          {PROFILE_TAB_KEYS.map(key => (
            <Toggle.Item
              key={key}
              name={key}
              label={labels[key]}
              testID={`profileTabsEditor-${key}`}
              style={[
                a.flex_1,
                a.py_xs,
                platform({
                  native: [a.justify_between],
                  web: [a.flex_row_reverse, a.gap_sm],
                }),
              ]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
                {labels[key]}
              </Toggle.LabelText>
              <Toggle.Checkbox />
            </Toggle.Item>
          ))}
        </View>
      </Toggle.Group>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>
          Hiding a tab only changes your profile in mu. What’s behind it stays
          public and may still show in other apps. Likes only ever show to you.
        </Trans>
      </Text>
    </View>
  )
}
