<script lang="ts">
  import { getClient } from '$lib/api/client.svelte'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import { Button, Material, toast } from 'mono-svelte'
  import {
    ArrowDownTray,
    ArrowUpTray,
    Icon,
    ServerStack,
  } from 'svelte-hero-icons/dist'

  // A settings export lists blocked users, blocked communities and
  // subscriptions, so it is built and consumed entirely in the browser. It is
  // never sent anywhere except back to the user's own instance.
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024

  let exporting = $state(false)
  let importing = $state(false)
  let fileInput: HTMLInputElement | undefined = $state()

  async function exportSettings() {
    exporting = true
    let url: string | undefined

    try {
      const data = await getClient().exportSettings()
      const blob = new Blob([data], { type: 'application/json' })
      url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `photon-settings-${new Date().toISOString().slice(0, 10)}.json`
      link.click()

      // Revoking synchronously can cancel the download before the browser has
      // read the blob, so it waits for the current task to finish first.
      const objectURL = url
      setTimeout(() => URL.revokeObjectURL(objectURL), 0)
    } catch (error) {
      if (url) URL.revokeObjectURL(url)
      toast({ content: errorMessage(error as string), type: 'error' })
    } finally {
      exporting = false
    }
  }

  async function importSettings(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    importing = true

    try {
      if (file.size > MAX_IMPORT_BYTES) {
        throw new Error(
          `That file is ${Math.round(file.size / 1024 / 1024)} MB, larger than the ${MAX_IMPORT_BYTES / 1024 / 1024} MB limit.`,
        )
      }

      // Parsed here so a mistaken file selection fails locally rather than
      // being uploaded to the instance.
      const parsed = JSON.parse(await file.text())

      await getClient().importSettings(parsed)
      toast({ content: $t('toast.accountDataImported'), type: 'success' })
    } catch (error) {
      toast({ content: errorMessage(error as string), type: 'error' })
    } finally {
      importing = false
      if (fileInput) fileInput.value = ''
    }
  }
</script>

<Material color="distinct" class="flex flex-col gap-3">
  <div class="flex items-center gap-2 font-medium">
    <Icon src={ServerStack} size="16" micro />
    {$t('settings.backup.title')}
  </div>
  <p class="text-sm text-slate-600 dark:text-zinc-400">
    {$t('settings.backup.description')}
  </p>
  <div class="flex flex-row gap-2 flex-wrap">
    <Button
      onclick={exportSettings}
      loading={exporting}
      disabled={exporting}
      size="md"
    >
      {#snippet prefix()}
        <Icon src={ArrowDownTray} size="16" micro />
      {/snippet}
      {$t('settings.export')}
    </Button>
    <Button
      onclick={() => fileInput?.click()}
      loading={importing}
      disabled={importing}
      size="md"
    >
      {#snippet prefix()}
        <Icon src={ArrowUpTray} size="16" micro />
      {/snippet}
      {$t('settings.import')}
    </Button>
  </div>
  <input
    bind:this={fileInput}
    onchange={importSettings}
    type="file"
    accept="application/json,.json"
    class="hidden"
  />
</Material>
