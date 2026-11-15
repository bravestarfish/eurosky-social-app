import {type Client} from '@atproto/lex'
import {type DidString} from '@atproto/syntax'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {createServiceClient} from '#/lib/lexClient'
import {isRecordNotFoundError} from '#/lib/xrpc-error'
import {STALE} from '#/state/queries'
import {createQueryKey} from '#/state/queries/util'
import {usePdsClient, useSession} from '#/state/session'
import {resolveDidAndPds} from '#/state/session/resolve-pds'
import {com} from '#/lexicons'
import {
  DEFAULT_PROFILE_TABS,
  normalizeProfileTabs,
  parseProfileTabs,
  PROFILE_TABS_COLLECTION,
  type ProfileTabKey,
} from './tabs'

export {ProfileTabsEditor} from './ProfileTabsEditor'
export {
  DEFAULT_PROFILE_TABS,
  normalizeProfileTabs,
  PROFILE_TAB_KEYS,
  type ProfileTabKey,
  sameProfileTabs,
} from './tabs'

const profileTabsQueryKey = (did: string) =>
  createQueryKey('profileTabs', {did})

async function readProfileTabs(
  client: Client,
  did: DidString,
): Promise<ProfileTabKey[]> {
  try {
    const result = await client.call(
      com.atproto.repo.getRecord,
      {repo: did, collection: PROFILE_TABS_COLLECTION, rkey: 'self'},
      {service: null},
    )
    return parseProfileTabs(result.value)
  } catch (error) {
    if (isRecordNotFoundError(error)) return DEFAULT_PROFILE_TABS
    throw error
  }
}

/**
 * The tabs an account shows on its profile. The choice is public and belongs
 * to the owner, so it is read from their own repository, like a Frontpage.
 */
export function useProfileTabsQuery(did: string | undefined) {
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  return useQuery({
    queryKey: profileTabsQueryKey(did ?? ''),
    staleTime: STALE.MINUTES.FIVE,
    enabled: !!did,
    retry: 1,
    async queryFn() {
      if (!did) return DEFAULT_PROFILE_TABS
      const repo = did as DidString
      if (currentAccount?.did === repo) return readProfileTabs(pdsClient, repo)
      const {pds} = await resolveDidAndPds(repo)
      return readProfileTabs(createServiceClient(pds), repo)
    },
  })
}

export function useSaveProfileTabsMutation() {
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    async mutationFn(tabs: string[]) {
      const did = currentAccount?.did
      if (!did) throw new Error('Sign in to choose your profile tabs.')
      const normalized = normalizeProfileTabs(tabs)
      if (normalized.length === 0) {
        throw new Error('A profile needs at least one tab.')
      }
      await pdsClient.call(
        com.atproto.repo.putRecord,
        {
          repo: did,
          collection: PROFILE_TABS_COLLECTION,
          rkey: 'self',
          record: {
            $type: PROFILE_TABS_COLLECTION,
            tabs: normalized,
            updatedAt: new Date().toISOString(),
          },
          validate: false,
        },
        {service: null},
      )
      return {did, tabs: normalized}
    },
    onSuccess({did, tabs}) {
      queryClient.setQueryData(profileTabsQueryKey(did), tabs)
    },
  })
}
