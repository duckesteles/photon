<script lang="ts">
  import { client, site } from '$lib/api/client.svelte'
  import type { CustomEmojiView } from '$lib/api/types'
  import { profile } from '$lib/app/auth'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import Placeholder from '$lib/ui/info/Placeholder.svelte'
  import { CommonList, Header } from '$lib/ui/layout'
  import { Button, Material, TextInput, toast } from 'mono-svelte'
  import { FaceSmile, Icon, Plus, Trash } from 'svelte-hero-icons/dist'

  let emojis = $state<CustomEmojiView[]>(site.data?.custom_emojis ?? [])

  let form = $state({
    // Set when an existing emoji is being edited; the shortcode is immutable
    // once created, so it is only sent on the create path.
    id: undefined as number | undefined,
    shortcode: '',
    image_url: '',
    alt_text: '',
    category: '',
    loading: false,
  })

  function reset() {
    form.id = undefined
    form.shortcode = ''
    form.image_url = ''
    form.alt_text = ''
    form.category = ''
  }

  function edit(view: CustomEmojiView) {
    form.id = view.custom_emoji.id
    form.shortcode = view.custom_emoji.shortcode
    form.image_url = view.custom_emoji.image_url
    form.alt_text = view.custom_emoji.alt_text
    form.category = view.custom_emoji.category
  }

  async function save(e: SubmitEvent) {
    e.preventDefault()
    if (!profile.current?.jwt) return

    form.loading = true

    try {
      const res = form.id
        ? await client().editCustomEmoji({
            id: form.id,
            image_url: form.image_url,
            alt_text: form.alt_text,
            category: form.category,
            keywords: [],
          })
        : await client().createCustomEmoji({
            shortcode: form.shortcode,
            image_url: form.image_url,
            alt_text: form.alt_text,
            category: form.category,
            keywords: [],
          })

      const index = emojis.findIndex(
        (i) => i.custom_emoji.id == res.custom_emoji.custom_emoji.id,
      )
      if (index == -1) emojis.push(res.custom_emoji)
      else emojis[index] = res.custom_emoji

      if (site.data) site.data.custom_emojis = emojis

      toast({ content: $t('toast.emojiSaved'), type: 'success' })
      reset()
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    }

    form.loading = false
  }

  async function remove(id: number) {
    if (!profile.current?.jwt) return

    try {
      await client().deleteCustomEmoji({ id })

      emojis = emojis.filter((i) => i.custom_emoji.id != id)
      if (site.data) site.data.custom_emojis = emojis

      toast({ content: $t('toast.emojiDeleted'), type: 'success' })
      if (form.id == id) reset()
    } catch (err) {
      toast({ content: errorMessage(err as string), type: 'error' })
    }
  }
</script>

<svelte:head>
  <title>{$t('routes.admin.emojis.title')}</title>
</svelte:head>

<Header pageHeader>{$t('routes.admin.emojis.title')}</Header>

{#if emojis.length == 0}
  <Placeholder
    icon={FaceSmile}
    title={$t('routes.admin.emojis.empty.title')}
    description={$t('routes.admin.emojis.empty.description')}
  />
{:else}
  <CommonList items={emojis}>
    {#snippet item(emoji)}
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="flex items-center gap-2 min-w-0 text-left"
          onclick={() => edit(emoji)}
        >
          <img
            src={emoji.custom_emoji.image_url}
            alt={emoji.custom_emoji.alt_text}
            width="28"
            height="28"
            class="size-7 object-contain shrink-0"
            loading="lazy"
          />
          <div class="flex flex-col min-w-0">
            <span class="font-medium truncate">
              :{emoji.custom_emoji.shortcode}:
            </span>
            <span class="text-xs text-slate-600 dark:text-zinc-400 truncate">
              {emoji.custom_emoji.category}
            </span>
          </div>
        </button>
        <Button
          size="square-md"
          color="danger-subtle"
          title={$t('common.remove')}
          onclick={() => remove(emoji.custom_emoji.id)}
        >
          <Icon src={Trash} mini size="16" />
        </Button>
      </div>
    {/snippet}
  </CommonList>
{/if}

<Material color="distinct" class="mt-auto">
  <form class="flex flex-col gap-3" onsubmit={save}>
    <TextInput
      bind:value={form.shortcode}
      label={$t('routes.admin.emojis.shortcode')}
      disabled={form.id != undefined}
      required
    />
    <TextInput
      bind:value={form.image_url}
      label={$t('routes.admin.emojis.url')}
      type="url"
      required
    />
    <TextInput
      bind:value={form.alt_text}
      label={$t('routes.admin.emojis.altText')}
      required
    />
    <TextInput
      bind:value={form.category}
      label={$t('routes.admin.emojis.category')}
      required
    />
    <div class="flex flex-row gap-2">
      {#if form.id}
        <Button size="lg" class="flex-1" onclick={reset}>
          {$t('common.cancel')}
        </Button>
      {/if}
      <Button
        submit
        size="lg"
        color="primary"
        class="flex-1"
        loading={form.loading}
        disabled={form.loading}
        icon={form.id ? undefined : Plus}
      >
        {form.id ? $t('common.save') : $t('routes.admin.emojis.add')}
      </Button>
    </div>
  </form>
</Material>
