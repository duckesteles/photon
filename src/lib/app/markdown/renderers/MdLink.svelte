<script lang="ts">
  import { photonify } from './plugins'

  interface Props {
    href?: string
    title?: string
    children?: import('svelte').Snippet
  }

  let { href = '', title = undefined, children }: Props = $props()

  export const parseURL = (href: string) => {
    try {
      return new URL(href)
    } catch {
      return undefined
    }
  }

  const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'magnet:']

  const safeHref = (value: string): string | undefined => {
    const parsed = parseURL(value)
    if (!parsed) return value

    return SAFE_PROTOCOLS.includes(parsed.protocol) ? value : undefined
  }

  let photonified = $derived(photonify(href))
  let resolved = $derived(photonified ?? safeHref(href))
</script>

<a
  href={resolved}
  {title}
  class="hover:underline text-blue-600 dark:text-blue-400"
>
  {@render children?.()}
</a>
