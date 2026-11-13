import {isProfileSpaceRoute} from './profileSpace'

describe('isProfileSpaceRoute', () => {
  it.each([
    'Messages',
    'Library',
    'Settings',
    'AccountSettings',
    'AppPasswords',
    'Moderation',
  ])('treats %s as opened from your profile', routeName => {
    expect(isProfileSpaceRoute(routeName)).toBe(true)
  })

  it.each(['Home', 'Search', 'Notifications', 'NewsFeed', 'Profile'])(
    'does not treat %s as opened from your profile',
    routeName => {
      expect(isProfileSpaceRoute(routeName)).toBe(false)
    },
  )
})
