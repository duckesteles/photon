<script lang="ts">
  import type { Instance } from '$lib/api/types'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import ObjectAutocomplete from '$lib/ui/form/ObjectAutocomplete.svelte'
  import ItemList from '$lib/ui/generic/ItemList.svelte'
  import Placeholder from '$lib/ui/info/Placeholder.svelte'
  import { Button, removeToast, toast } from 'mono-svelte'
  import { Check, Trash } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let query = $state('')
  let blocking = $state(false)

  async function block(instance?: Instance) {
    const blocks = data.my_user?.instance_blocks
    if (!instance || !blocks) return
    if (blocks.some((i) => i.instance.id == instance.id)) {
      query = ''
      return
    }

    const me = data.my_user?.local_user_view.person
    if (!me) return

    blocking = true
    const loading = toast({ content: '', loading: true })
    try {
      await profile.client.blockInstance({
        block: true,
        instance_id: instance.id,
      })
      blocks.push({ person: me, instance })
      query = ''
      toast({ content: $t('toast.blockedInstance'), type: 'success' })
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    } finally {
      removeToast(loading)
      blocking = false
    }
  }

  async function unblock(id: number) {
    const blocks = data.my_user?.instance_blocks
    if (!blocks) return
    const index = blocks.findIndex((i) => i.instance.id == id)
    if (index < 0) return

    const [removed] = blocks.splice(index, 1)
    try {
      await profile.client.blockInstance({ block: false, instance_id: id })
      toast({ content: $t('toast.unblockedInstance'), type: 'success' })
    } catch (err) {
      blocks.splice(index, 0, removed)
      toast({ content: errorMessage(err as string), type: 'error' })
    }
  }
</script>

<div class="flex flex-col gap-4">
  <ObjectAutocomplete
    type="instance"
    bind:q={query}
    placeholder={$t('routes.profile.blocks.add.instance')}
    onselect={block}
  />

  {#if data.my_user?.instance_blocks && data.my_user.instance_blocks.length > 0}
    <ItemList
      items={data.my_user.instance_blocks.map((i) => ({
        id: i.instance.id,
        name: i.site?.name ?? i.instance.domain,
        avatar: i.site?.icon,
        instance: i.instance.domain,
      }))}
      link={false}
    >
      {#snippet action(block)}
        <Button
          title={$t('common.unblock')}
          size="square-md"
          disabled={blocking}
          onclick={() => unblock(block.id)}
          icon={Trash}
        />
      {/snippet}
    </ItemList>
  {:else}
    <Placeholder
      title={$t('routes.profile.blocks.empty.instance.title')}
      description={$t('routes.profile.blocks.empty.instance.description')}
      icon={Check}
      class="my-auto"
    />
  {/if}
</div>
