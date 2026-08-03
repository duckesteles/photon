<script lang="ts">
  import { getClient } from '$lib/api/client.svelte'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import UserAutocomplete from '$lib/feature/user/UserAutocomplete.svelte'
  import Avatar from '$lib/ui/generic/Avatar.svelte'
  import { CommonList, Header } from '$lib/ui/layout'
  import { action, Button, modal, toast } from 'mono-svelte'
  import { Icon, Key, Plus, Trash } from 'svelte-hero-icons/dist'
  import type { PageData } from '../$types'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()

  let formData = $state({
    newModerator: -1,
    addingModerator: false,
  })

  async function addModerator() {
    if (!profile.current?.jwt) return

    formData.addingModerator = true

    try {
      if (formData.newModerator != -1) {
        const addModRes = await getClient().addModToCommunity({
          added: true,
          person_id: formData.newModerator,
          community_id: data.community.value.community_view.community.id,
        })

        data.community.value.moderators = addModRes.moderators

        toast({
          content: $t('toast.addMod'),
          type: 'success',
        })

        formData.newModerator = -1
      } else {
        toast({
          content: $t('toast.failFindUser'),
          type: 'warning',
        })
      }
    } catch (err) {
      toast({
        content: errorMessage(err as string),
        type: 'error',
      })
    }

    formData.addingModerator = false
  }

  async function transferCommunity(id: number) {
    if (!profile.current?.jwt) return

    try {
      const res = await getClient().transferCommunity({
        community_id: data.community.value.community_view.community.id,
        person_id: id,
      })

      data.community.value.moderators = res.moderators

      toast({
        content: $t('moderation.transfer.done'),
        type: 'success',
      })
    } catch (err) {
      toast({
        content: errorMessage(err as string),
        type: 'error',
      })
    }
  }

  async function removeMod(id: number) {
    if (!profile.current?.jwt) return

    try {
      const res = await getClient().addModToCommunity({
        added: false,
        community_id: data.community.value.community_view.community.id,
        person_id: id,
      })

      data.community.value.moderators = res.moderators

      toast({
        content: $t('toast.updateMods'),
        type: 'success',
      })
    } catch (err) {
      toast({
        content: errorMessage(err as string),
        type: 'error',
      })
    }
  }
</script>

<Header pageHeader>Moderators</Header>
<CommonList items={data.community.value.moderators}>
  {#snippet item(moderator)}
    <div class="flex items-center gap-2 justify-between">
      <div class="flex gap-2 items-center">
        <Avatar
          width={28}
          url={moderator.moderator.avatar}
          alt={moderator.moderator.name}
        />
        <div class="flex flex-col gap-0">
          {moderator.moderator.display_name ?? moderator.moderator.name}
          <span class="text-xs text-slate-600 dark:text-zinc-400">
            {new URL(moderator.moderator.actor_id).hostname}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="square-md"
          title={$t('moderation.transfer.action')}
          onclick={() => {
            modal({
              title: $t('moderation.transfer.action'),
              body: $t('moderation.transfer.confirm', {
                user: moderator.moderator.name,
              }),
              actions: [
                action({
                  content: $t('moderation.transfer.action'),
                  action: () => transferCommunity(moderator.moderator.id),
                  type: 'danger',
                  close: true,
                }),
                action({
                  content: $t('common.cancel'),
                  close: true,
                }),
              ],
            })
          }}
        >
          <Icon src={Key} mini size="16" />
        </Button>
        <Button
          size="square-md"
          title={$t('common.remove')}
          onclick={() => {
            modal({
              title: $t('common.remove'),
              body: `Are you sure you want to remove ${moderator.moderator.name} as a moderator?`,
              actions: [
                action({
                  content: $t('common.remove'),
                  action: () => removeMod(moderator.moderator.id),
                  type: 'danger',
                  close: true,
                }),
                action({
                  content: $t('common.cancel'),
                  close: true,
                }),
              ],
            })
          }}
        >
          <Icon src={Trash} mini size="16" />
        </Button>
      </div>
    </div>
  {/snippet}
</CommonList>
<form
  onsubmit={(e) => {
    e.preventDefault()
    addModerator()
  }}
  class="mt-auto flex gap-2 w-full mb-3 sm:mb-6"
>
  <div class="w-full">
    <UserAutocomplete
      listing_type="All"
      onselect={(p) => {
        if (p) formData.newModerator = p.id
      }}
    />
  </div>
  <Button
    loading={formData.addingModerator}
    disabled={formData.addingModerator}
    rounding="xl"
    color="primary"
    submit
    icon={Plus}
  >
    {$t('common.add')}
  </Button>
</form>
