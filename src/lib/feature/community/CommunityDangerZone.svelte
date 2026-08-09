<script lang="ts">
  import { goto } from '$app/navigation'
  import { getClient } from '$lib/api/client.svelte'
  import type { Community } from '$lib/api/types'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import { Button, Label, Material, Modal, TextInput, toast } from 'mono-svelte'

  interface Props {
    community: Community
  }

  let { community }: Props = $props()

  type Action = 'delete' | 'remove' | 'hide'

  let pending = $state<Action | undefined>(undefined)
  let modalOpen = $state(false)
  let reason = $state('')
  let loading = $state(false)

  const label = (action: Action) =>
    ({
      delete: community.deleted
        ? $t('moderation.restore')
        : $t('moderation.danger.delete'),
      remove: community.removed
        ? $t('moderation.restore')
        : $t('moderation.remove'),
      hide: community.hidden
        ? $t('moderation.danger.unhide')
        : $t('moderation.danger.hide'),
    })[action]

  function ask(action: Action) {
    pending = action
    reason = ''
    modalOpen = true
  }

  async function confirm() {
    if (!pending) return
    loading = true

    try {
      if (pending == 'delete') {
        const deleted = !community.deleted
        const res = await getClient().deleteCommunity({
          community_id: community.id,
          deleted: deleted,
        })
        community.deleted = res.community_view.community.deleted

        modalOpen = false
        pending = undefined
        if (deleted) {
          await goto('/communities')
          return
        }
      } else if (pending == 'remove') {
        const res = await getClient().removeCommunity({
          community_id: community.id,
          removed: !community.removed,
          reason: reason || undefined,
        })
        community.removed = res.community_view.community.removed

        modalOpen = false
        pending = undefined
      } else {
        const hidden = !community.hidden
        await getClient().hideCommunity({
          community_id: community.id,
          hidden: hidden,
          reason: reason || undefined,
        })
        community.hidden = hidden

        modalOpen = false
        pending = undefined
      }

      toast({ content: $t('toast.updatedCommunity'), type: 'success' })
    } catch (error) {
      toast({ content: errorMessage(error as string), type: 'error' })
    } finally {
      loading = false
    }
  }
</script>

{#if profile.isMod(community)}
  <div class="space-y-1">
    <Label id="community-danger-zone">
      {$t('moderation.danger.title')}
    </Label>
    <p class="text-slate-600 dark:text-zinc-400">
      {$t('moderation.danger.description')}
    </p>
    <Material rounding="xl" color="uniform" class="dark:bg-zinc-950">
      <div class="flex flex-row gap-2 flex-wrap">
        <Button color="danger-subtle" size="md" onclick={() => ask('delete')}>
          {label('delete')}
        </Button>
        {#if profile.isAdmin}
          <Button color="danger-subtle" size="md" onclick={() => ask('remove')}>
            {label('remove')}
          </Button>
          <Button color="danger-subtle" size="md" onclick={() => ask('hide')}>
            {label('hide')}
          </Button>
        {/if}
      </div>
    </Material>
  </div>
{/if}

{#if pending}
  <Modal
    bind:open={modalOpen}
    title={label(pending)}
    ondismissed={() => (pending = undefined)}
  >
    <p class="text-sm text-slate-600 dark:text-zinc-400">
      {$t('moderation.danger.confirm', { community: community.title })}
    </p>
    {#if pending != 'delete'}
      <TextInput bind:value={reason} label={$t('moderation.reason')} />
    {/if}
    <div class="flex flex-row gap-2 items-center">
      <Button size="lg" class="flex-1" onclick={() => (modalOpen = false)}>
        {$t('common.cancel')}
      </Button>
      <Button
        size="lg"
        class="flex-1"
        color="danger"
        {loading}
        disabled={loading}
        onclick={confirm}
      >
        {label(pending)}
      </Button>
    </div>
  </Modal>
{/if}
