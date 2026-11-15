import {useEffect} from 'react'
import {Pressable, ScrollView, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Portal} from '#/components/Portal'
import {AccountMenuContent} from './AccountMenu'

/** Gap between the bottom bar and the menu, and from the screen edge. */
const OFFSET = 10

const MENU_ID = 'account-menu-popover'

/**
 * The account menu on mobile web: a popover that rises from the profile
 * picture at the right of the bottom bar, so it is in reach of the thumb.
 * The apps use the bottom sheet in AccountMenuDialog instead.
 */
export function AccountMenuPopover({
  open,
  onClose,
  bottomOffset,
}: {
  open: boolean
  onClose: () => void
  /** Height of the bottom bar, so the menu sits just above it. */
  bottomOffset: number
}) {
  if (!open) return null
  return (
    <Portal>
      <Inner onClose={onClose} bottomOffset={bottomOffset} />
    </Portal>
  )
}

function Inner({
  onClose,
  bottomOffset,
}: {
  onClose: () => void
  bottomOffset: number
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const bottom = bottomOffset + OFFSET

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.getElementById(MENU_ID)?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const close = (then?: () => void) => {
    onClose()
    if (then) setTimeout(then, 0)
  }

  return (
    <View style={[a.inset_0, {position: 'fixed' as 'absolute', zIndex: 50}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Close menu`}
        accessibilityHint=""
        onPress={() => close()}
        style={[a.absolute, a.inset_0, {backgroundColor: 'rgba(0,0,0,0.28)'}]}
      />
      <View
        nativeID={MENU_ID}
        role="dialog"
        aria-modal
        aria-label={l`Account menu`}
        tabIndex={-1}
        style={[
          a.absolute,
          a.rounded_lg,
          a.border,
          a.overflow_hidden,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          {
            right: OFFSET,
            bottom,
            width: 300,
            maxWidth: `calc(100vw - ${OFFSET * 2}px)` as unknown as number,
            maxHeight:
              `calc(100vh - ${bottom + OFFSET}px)` as unknown as number,
          },
        ]}>
        <ScrollView contentContainerStyle={[a.p_sm]}>
          <AccountMenuContent onClose={close} />
        </ScrollView>
      </View>
      {/* Points at the profile picture in the bar. */}
      <View
        aria-hidden
        style={[
          a.absolute,
          a.border_r,
          a.border_b,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          {
            right: OFFSET + 24,
            bottom: bottom - 7,
            width: 14,
            height: 14,
            transform: [{rotate: '45deg'}],
          },
        ]}
      />
    </View>
  )
}
