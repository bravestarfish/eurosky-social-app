import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {getAtmosphereApps} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereAppsQuery} from '#/screens/Atmosphere/data/useAtmosphereAppsQuery'
import {atoms as a, useTheme} from '#/alf'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Earth'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import * as ModuleHeader from '../components/ModuleHeader'

/**
 * Atmosphere used to have its own place in the drawer. It now lives in Search:
 * a short intro, a few app categories and a way into the full Atmosphere.
 */
export function ExploreAtmosphere() {
  const ax = useAnalytics()
  const enabled = ax.features.enabled(ax.features.AtmosphereScreenEnable)
  return enabled ? <Inner /> : null
}

function Inner() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data} = useAtmosphereAppsQuery()

  /** Keys are the category values sent by the backend. */
  const categoryDefinitions = [
    {key: 'social', label: l`Social`},
    {key: 'writing', label: l`Blogging`},
    {key: 'photography', label: l`Photo`},
    {key: 'video', label: l`Video`},
    {key: 'events', label: l`Events`},
    {key: 'games', label: l`Games`},
  ]
  const categories = data
    ? categoryDefinitions
        .map(category => ({
          ...category,
          count: getAtmosphereApps(data, category.key).length,
        }))
        .filter(category => category.count > 0)
        .slice(0, 4)
    : []

  return (
    <View style={[a.pb_md]}>
      <ModuleHeader.Container style={[a.pb_xs]}>
        <ModuleHeader.Icon icon={EarthIcon} size="md" />
        <ModuleHeader.TitleText>
          <Trans>Atmosphere</Trans>
        </ModuleHeader.TitleText>
        <Link
          to="/atmosphere"
          label={l`See all Atmosphere apps`}
          style={[a.py_xs]}>
          <Text style={[a.text_sm, a.font_semi_bold, t.atoms.text]}>
            <Trans>See all</Trans>
          </Text>
        </Link>
      </ModuleHeader.Container>
      <Text style={[a.px_lg, a.pb_md, a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>
          Other apps on the open network. Your mu account works in all of them.
        </Trans>
      </Text>
      {categories.length > 0 && (
        <View style={[a.flex_row, a.flex_wrap, a.px_lg, a.gap_sm]}>
          {categories.map(category => (
            <Link
              key={category.key}
              to="/atmosphere"
              label={category.label}
              style={[
                a.flex_col,
                a.align_start,
                a.p_md,
                a.rounded_md,
                a.gap_2xs,
                t.atoms.bg_contrast_25,
                {flexBasis: '47%', flexGrow: 1},
              ]}>
              <Text style={[a.text_md, a.font_semi_bold, t.atoms.text]}>
                {category.label}
              </Text>
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Plural value={category.count} one="# app" other="# apps" />
              </Text>
            </Link>
          ))}
        </View>
      )}
    </View>
  )
}
