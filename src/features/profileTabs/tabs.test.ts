import {
  DEFAULT_PROFILE_TABS,
  normalizeProfileTabs,
  parseProfileTabs,
  sameProfileTabs,
} from './tabs'

describe('parseProfileTabs', () => {
  it('uses the first four tabs when there is no choice', () => {
    expect(parseProfileTabs(undefined)).toEqual(DEFAULT_PROFILE_TABS)
    expect(parseProfileTabs({})).toEqual(DEFAULT_PROFILE_TABS)
    expect(parseProfileTabs({tabs: 'posts'})).toEqual(DEFAULT_PROFILE_TABS)
  })

  it('keeps known tabs in display order without duplicates', () => {
    expect(
      parseProfileTabs({tabs: ['lists', 'posts', 'lists', 'feeds']}),
    ).toEqual(['posts', 'feeds', 'lists'])
  })

  it('ignores tabs it does not know', () => {
    expect(parseProfileTabs({tabs: ['videos', 'media']})).toEqual(['media'])
  })

  it('never leaves a profile with no tabs', () => {
    expect(parseProfileTabs({tabs: []})).toEqual(DEFAULT_PROFILE_TABS)
    expect(parseProfileTabs({tabs: ['videos']})).toEqual(DEFAULT_PROFILE_TABS)
  })
})

describe('normalizeProfileTabs', () => {
  it('orders a selection for saving', () => {
    expect(normalizeProfileTabs(['likes', 'posts', 'nope'])).toEqual([
      'posts',
      'likes',
    ])
  })
})

describe('sameProfileTabs', () => {
  it('compares selections', () => {
    expect(sameProfileTabs(['posts'], ['posts'])).toBe(true)
    expect(sameProfileTabs(['posts'], ['posts', 'media'])).toBe(false)
  })
})
