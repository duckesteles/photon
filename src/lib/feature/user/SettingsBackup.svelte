<script lang="ts">
  import { getClient } from '$lib/api/client.svelte'
  import { errorMessage } from '$lib/app/error'
  import { t } from '$lib/app/i18n'
  import { Button, Label, Material, toast } from 'mono-svelte'
  import { ArrowDownTray, ArrowUpTray } from 'svelte-hero-icons/dist'

  const MAX_IMPORT_BYTES = 5 * 1024 * 1024

  let exporting = $state(false)
  let importing = $state(false)
  let fileInput: HTMLInputElement | undefined = $state()

  async function exportSettings() {
    exporting = true
    let url: string | undefined

    try {
      const data = await getClient().exportSettings()
      const json = typeof data === 'string' ? data : JSON.stringify(data)
      const blob = new Blob([json], { type: 'application/json' })
      url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `photon-settings-${new Date().toISOString().slice(0, 10)}.json`
      link.click()

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

<div class="space-y-1">
  <Label id="account-backup">
    {$t('settings.backup.title')}
  </Label>
  <p class="text-slate-600 dark:text-zinc-400">
    {$t('settings.backup.description')}
  </p>
  <Material rounding="xl" color="uniform" class="dark:bg-zinc-950">
    <div class="flex flex-row gap-2 flex-wrap">
      <Button
        onclick={exportSettings}
        loading={exporting}
        disabled={exporting}
        icon={ArrowDownTray}
        size="md"
      >
        {$t('settings.export')}
      </Button>
      <Button
        onclick={() => fileInput?.click()}
        loading={importing}
        disabled={importing}
        icon={ArrowUpTray}
        size="md"
      >
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
</div>
