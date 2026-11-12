import {useCallback} from 'react'

import {useDialogStateControlContext} from '#/state/dialogs'
import {useLightboxControls} from '#/components/Lightbox/state'
import {useComposerControls} from './shell/composer'

/**
 * returns true if something was closed
 * (used by the android hardware back btn)
 */
export function useCloseAnyActiveElement() {
  const {closeLightbox} = useLightboxControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs} = useDialogStateControlContext()
  return useCallback(() => {
    if (closeLightbox()) {
      return true
    }
    if (closeAllDialogs()) {
      return true
    }
    if (closeComposer()) {
      return true
    }
    return false
  }, [closeLightbox, closeComposer, closeAllDialogs])
}

/**
 * used to clear out any modals, eg for a navigation
 */
export function useCloseAllActiveElements() {
  const {closeLightbox} = useLightboxControls()
  const {closeComposer} = useComposerControls()
  const {closeAllDialogs: closeAlfDialogs} = useDialogStateControlContext()
  return useCallback(() => {
    closeLightbox()
    closeComposer()
    closeAlfDialogs()
  }, [closeLightbox, closeComposer, closeAlfDialogs])
}
