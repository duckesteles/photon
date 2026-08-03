<script lang="ts">
  import { client } from '$lib/api/client.svelte'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import UserLink from '$lib/feature/user/UserLink.svelte'
  import Placeholder from '$lib/ui/info/Placeholder.svelte'
  import { CommonList, Header } from '$lib/ui/layout'
  import { Button, toast } from 'mono-svelte'
  import { CheckCircle, NoSymbol } from 'svelte-hero-icons/dist'

  let { data } = $props()

  let unbanning = $state<number | undefined>(undefined)

  async function unban(id: number) {
    if (!profile.current?.jwt) return

    unbanning = id

    try {
      await client().banPerson({ person_id: id, ban: false })

      data.banned.value = data.banned.value.filter((i) => i.person.id != id)
      toast({ content: $t('toast.unbanned'), type: 'success' })
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    }

    unbanning = undefined
  }
</script>

<svelte:head>
  <title>{$t('routes.admin.banned.title')}</title>
</svelte:head>

<Header pageHeader>{$t('routes.admin.banned.title')}</Header>
{#if data.banned.value.length == 0}
  <Placeholder
    icon={NoSymbol}
    title={$t('routes.admin.banned.empty.title')}
    description={$t('routes.admin.banned.empty.description')}
  />
{:else}
  <CommonList items={data.banned.value}>
    {#snippet item(banned)}
      <div class="flex items-center justify-between gap-2">
        <UserLink avatar showInstance={false} user={banned.person} />
        <Button
          size="md"
          icon={CheckCircle}
          loading={unbanning == banned.person.id}
          disabled={unbanning == banned.person.id}
          onclick={() => unban(banned.person.id)}
        >
          {$t('moderation.ban.unbanFromSite')}
        </Button>
      </div>
    {/snippet}
  </CommonList>
{/if}
