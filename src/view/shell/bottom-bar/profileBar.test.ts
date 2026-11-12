import {buildStateObject} from '#/lib/routes/helpers'
import {type State} from '#/lib/routes/types'
import {shouldShowProfileBarNative, shouldShowProfileBarWeb} from './profileBar'

function asState(value: unknown) {
  return value as State
}

describe('shouldShowProfileBarNative', () => {
  it('shows the Profile bar on your own profile root', () => {
    const state = asState(
      buildStateObject('MyProfileTab', 'MyProfile', {name: 'me'}),
    )
    expect(shouldShowProfileBarNative(state)).toBe(true)
  })

  it('goes back to the main bar for screens opened from your profile', () => {
    const state = asState(
      buildStateObject('MyProfileTab', 'PostThread', {name: 'a', rkey: 'b'}, [
        {name: 'MyProfile', params: {name: 'me'}},
      ]),
    )
    expect(shouldShowProfileBarNative(state)).toBe(false)
  })

  it.each([
    ['MessagesTab', 'Messages'],
    ['LibraryTab', 'Library'],
    ['SettingsTab', 'Settings'],
    ['SettingsTab', 'AccountSettings'],
    ['SettingsTab', 'Moderation'],
  ])('keeps the Profile bar in %s (%s)', (tab, screen) => {
    expect(
      shouldShowProfileBarNative(asState(buildStateObject(tab, screen, {}))),
    ).toBe(true)
  })

  it.each([
    ['HomeTab', 'Home'],
    ['NewsTab', 'NewsFeed'],
    ['SearchTab', 'Search'],
    ['NotificationsTab', 'Notifications'],
    ['HomeTab', 'Profile'],
  ])('shows the main bar in %s (%s)', (tab, screen) => {
    expect(
      shouldShowProfileBarNative(
        asState(buildStateObject(tab, screen, {name: 'bob.test'})),
      ),
    ).toBe(false)
  })

  it('shows the main bar before navigation state exists', () => {
    expect(shouldShowProfileBarNative(undefined)).toBe(false)
  })
})

describe('shouldShowProfileBarWeb', () => {
  const me = {currentHandle: 'alice.test', currentDid: 'did:plc:alice'}

  it('shows the Profile bar on your own profile, by handle or DID', () => {
    expect(
      shouldShowProfileBarWeb({
        ...me,
        routeName: 'Profile',
        profileName: 'alice.test',
      }),
    ).toBe(true)
    expect(
      shouldShowProfileBarWeb({
        ...me,
        routeName: 'Profile',
        profileName: 'did:plc:alice',
      }),
    ).toBe(true)
  })

  it("shows the main bar on someone else's profile", () => {
    expect(
      shouldShowProfileBarWeb({
        ...me,
        routeName: 'Profile',
        profileName: 'bob.test',
      }),
    ).toBe(false)
  })

  it.each([
    'Messages',
    'Library',
    'Settings',
    'AccountSettings',
    'AppPasswords',
    'Moderation',
  ])('keeps the Profile bar on %s', routeName => {
    expect(shouldShowProfileBarWeb({...me, routeName})).toBe(true)
  })

  it.each(['Home', 'Search', 'Notifications', 'NewsFeed', 'PostThread'])(
    'shows the main bar on %s',
    routeName => {
      expect(shouldShowProfileBarWeb({...me, routeName})).toBe(false)
    },
  )
})
