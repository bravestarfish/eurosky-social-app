import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {useIsFindContactsFeatureEnabledBasedOnGeolocation} from '#/components/contacts/country-allowlist'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {Contacts_Stroke2_Corner2_Rounded as ContactsIcon} from '#/components/icons/Contacts'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'

/**
 * Finding friends from your contacts used to sit at the top of Settings. It
 * now lives in Search, next to the other ways of finding people.
 */
export function ExploreFindFriends() {
  const ax = useAnalytics()
  const findContactsEnabled =
    useIsFindContactsFeatureEnabledBasedOnGeolocation()
  const enabled =
    IS_NATIVE &&
    findContactsEnabled &&
    !ax.features.enabled(ax.features.ImportContactsSettingsDisable)
  return enabled ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const {t: l} = useLingui()
  return (
    <View style={[a.px_lg, a.pt_lg]}>
      <Link
        to="/settings/find-contacts"
        label={l`Find and invite friends`}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_md,
          a.p_md,
          a.rounded_md,
          t.atoms.bg_contrast_25,
        ]}>
        <ContactsIcon size="md" fill={t.atoms.text.color} />
        <Text style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
          <Trans>Find and invite friends</Trans>
        </Text>
        <ChevronRightIcon size="sm" fill={t.atoms.text_contrast_medium.color} />
      </Link>
    </View>
  )
}
