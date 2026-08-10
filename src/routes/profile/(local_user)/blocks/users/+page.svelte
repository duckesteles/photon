<script lang="ts">
  import type { Person } from '$lib/api/types'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import { userLink } from '$lib/app/util.svelte.js'
  import UserAutocomplete from '$lib/feature/user/UserAutocomplete.svelte'
  import ItemList from '$lib/ui/generic/ItemList.svelte'
  import Placeholder from '$lib/ui/info/Placeholder.svelte'
  import { Button, removeToast, toast } from 'mono-svelte'
  import { ArrowUturnUp, Check, Trash } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let blocks = $state(data.person_blocks ?? [])
  let query = $state('')
  let blocking = $state(false)

  async function block(person?: Person) {
    if (blocking || !person) return
    if (blocks.some((i) => i.target.id == person.id)) {
      query = ''
      return
    }

    const me = data.my_user?.local_user_view.person
    if (!me) return

    blocking = true
    const loading = toast({ content: '', loading: true })
    try {
      await profile.client.blockPerson({ block: true, person_id: person.id })
      blocks.push({ person: me, target: person })
      query = ''
      toast({ content: $t('toast.blockedUser'), type: 'success' })
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    } finally {
      removeToast(loading)
      blocking = false
    }
  }

  async function unblock(id: number) {
    const index = blocks.findIndex((i) => i.target.id == id)
    if (index < 0) return

    const [removed] = blocks.splice(index, 1)
    try {
      await profile.client.blockPerson({ block: false, person_id: id })
      toast({ content: $t('toast.unblockedUser'), type: 'success' })
    } catch (err) {
      blocks.splice(index, 0, removed)
      toast({ content: errorMessage(err as string), type: 'error' })
    }
  }
</script>

<div class="flex flex-col gap-4">
  <UserAutocomplete
    listing_type="All"
    hideOwnUser
    bind:q={query}
    placeholder={$t('routes.profile.blocks.add.user')}
    onselect={block}
  />

  {#if blocks.length > 0}
    <ItemList
      items={blocks.map((i) => ({
        id: i.target.id,
        name: i.target.name,
        avatar: i.target.avatar,
        url: userLink(i.target),
        instance: new URL(i.target.actor_id).hostname,
        circle: true,
      }))}
      link={false}
    >
      {#snippet action(block)}
        <Button
          title={$t('common.jump')}
          size="square-md"
          href={block.url}
          color="primary"
          icon={ArrowUturnUp}
        />
        <Button
          title={$t('common.unblock')}
          size="square-md"
          onclick={() => unblock(block.id)}
          icon={Trash}
        />
      {/snippet}
    </ItemList>
  {:else}
    <Placeholder
      title={$t('routes.profile.blocks.empty.user.title')}
      description={$t('routes.profile.blocks.empty.user.description')}
      icon={Check}
      class="my-auto"
    />
  {/if}
</div>
