<script lang="ts">
  import type { CommunityView } from '$lib/api/types'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import { communityLink } from '$lib/app/util.svelte.js'
  import ObjectAutocomplete from '$lib/ui/form/ObjectAutocomplete.svelte'
  import ItemList from '$lib/ui/generic/ItemList.svelte'
  import Placeholder from '$lib/ui/info/Placeholder.svelte'
  import { Button, removeToast, toast } from 'mono-svelte'
  import { ArrowUturnUp, Check, Trash } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let blocks = $state(data.community_blocks ?? [])
  let query = $state('')
  let blocking = $state(false)

  async function block(view?: CommunityView) {
    if (blocking || !view) return
    if (blocks.some((i) => i.community.id == view.community.id)) {
      query = ''
      return
    }

    const me = data.my_user?.local_user_view.person
    if (!me) return

    blocking = true
    const loading = toast({ content: '', loading: true })
    try {
      await profile.client.blockCommunity({
        block: true,
        community_id: view.community.id,
      })
      blocks.push({ person: me, community: view.community })
      query = ''
      toast({ content: $t('toast.blockedCommunity'), type: 'success' })
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    } finally {
      removeToast(loading)
      blocking = false
    }
  }

  async function unblock(id: number) {
    const index = blocks.findIndex((i) => i.community.id == id)
    if (index < 0) return

    const [removed] = blocks.splice(index, 1)
    try {
      await profile.client.blockCommunity({ block: false, community_id: id })
      toast({ content: $t('toast.unblockedCommunity'), type: 'success' })
    } catch (err) {
      blocks.splice(index, 0, removed)
      toast({ content: errorMessage(err as string), type: 'error' })
    }
  }
</script>

<div class="flex flex-col gap-4">
  <ObjectAutocomplete
    type="community"
    listing_type="All"
    bind:q={query}
    placeholder={$t('routes.profile.blocks.add.community')}
    onselect={block}
  />

  {#if blocks.length > 0}
    <ItemList
      items={blocks.map((i) => ({
        id: i.community.id,
        name: i.community.title,
        avatar: i.community.icon,
        url: communityLink(i.community),
        instance: new URL(i.community.actor_id).hostname,
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
      title={$t('routes.profile.blocks.empty.community.title')}
      description={$t('routes.profile.blocks.empty.community.description')}
      icon={Check}
      class="my-auto"
    />
  {/if}
</div>
