import {useState} from 'react'
import {type GestureResponderEvent} from 'react-native'
import {AtUri} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {getTabNavigationAction} from '#/lib/routes/navigation'
import {
  type CommonNavigatorParams,
  type LibraryTabName,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {useSession} from '#/state/session'
import {MyLists} from '#/view/com/lists/MyLists'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {FeedsView} from '#/view/screens/Feeds'
import {BookmarksInner} from '#/screens/Bookmarks'
import {atoms as a, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {CreateOrEditListDialog} from '#/components/dialogs/lists/CreateOrEditListDialog'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {SettingsGear2_Stroke2_Corner0_Rounded as GearIcon} from '#/components/icons/SettingsGear2'
import * as Layout from '#/components/Layout'
import {Link} from '#/components/Link'

const TABS: LibraryTabName[] = ['saved', 'feeds', 'lists']

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Library'>

/**
 * Saved posts, your feeds and your lists, together in one place. Reached from
 * the Library item in the Profile bar.
 */
export function LibraryScreen({route}: Props) {
  const {t: l} = useLingui()
  const initialPage = Math.max(0, TABS.indexOf(route.params?.tab ?? 'saved'))
  const [page, setPage] = useState(initialPage)

  return (
    <Layout.Screen testID="libraryScreen">
      <Layout.Header.Outer noBottomBorder sticky={false}>
        <BackToProfileButton />
        <Layout.Header.Content align="left">
          <Layout.Header.TitleText>
            <Trans>Library</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        {TABS[page] === 'feeds' ? (
          <EditFeedsButton />
        ) : TABS[page] === 'lists' ? (
          <NewListButton />
        ) : (
          <Layout.Header.Slot />
        )}
      </Layout.Header.Outer>
      <Pager
        testID="libraryPager"
        initialPage={initialPage}
        onPageSelected={setPage}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <TabBar
              {...props}
              items={[
                l({message: 'Saved', context: 'library tab, saved posts'}),
                l({message: 'Feeds', context: 'library tab'}),
                l({message: 'Lists', context: 'library tab'}),
              ]}
            />
          </Layout.Center>
        )}>
        <BookmarksInner />
        <FeedsView embedded />
        <MyLists filter="curate" style={a.flex_grow} />
      </Pager>
    </Layout.Screen>
  )
}

/**
 * The Library opens from your profile, so back goes there when there is
 * nothing to go back to in this stack.
 */
function BackToProfileButton() {
  const navigation = useNavigation<NavigationProp>()
  const {currentAccount} = useSession()

  const onPress = (evt: GestureResponderEvent) => {
    if (navigation.canGoBack()) return
    evt.preventDefault()
    navigation.dispatch(
      getTabNavigationAction('MyProfile', currentAccount?.handle),
    )
  }

  return <Layout.Header.BackButton onPress={onPress} />
}

function EditFeedsButton() {
  const {t: l} = useLingui()
  return (
    <Layout.Header.Slot>
      <Link
        testID="editFeedsBtn"
        to="/settings/saved-feeds"
        label={l`Edit my feeds`}
        size="small"
        color="secondary"
        shape="round"
        style={[a.justify_center, a.bg_transparent]}>
        <ButtonIcon icon={GearIcon} size="lg" />
      </Link>
    </Layout.Header.Slot>
  )
}

function NewListButton() {
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()
  const createListDialogControl = useDialogControl()

  const onPressNewList = requireEmailVerification(
    () => createListDialogControl.open(),
    {
      instructions: [
        <Trans key="lists">
          Before creating a list, you must first verify your email.
        </Trans>,
      ],
    },
  )

  const onCreateList = (uri: string) => {
    try {
      const urip = new AtUri(uri)
      navigation.navigate('ProfileList', {
        name: urip.hostname,
        rkey: urip.rkey,
      })
    } catch {}
  }

  return (
    <>
      <Button
        label={l`New list`}
        testID="newUserListBtn"
        color="secondary"
        size="small"
        onPress={onPressNewList}>
        <ButtonIcon icon={PlusIcon} />
        <ButtonText>
          <Trans context="action">New</Trans>
        </ButtonText>
      </Button>
      <CreateOrEditListDialog
        purpose="app.bsky.graph.defs#curatelist"
        control={createListDialogControl}
        onSave={onCreateList}
      />
    </>
  )
}
