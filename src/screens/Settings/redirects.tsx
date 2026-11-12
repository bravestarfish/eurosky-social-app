import {SettingsRedirect} from './components/SettingsRedirect'

/** Thread and Following feed preferences now live in Feeds and content. */
export function FeedsAndContentRedirect() {
  return <SettingsRedirect to="ContentAndMediaSettings" />
}

/** Network services now live in the Account section. */
export function AccountSettingsRedirect() {
  return <SettingsRedirect to="AccountSettings" />
}
