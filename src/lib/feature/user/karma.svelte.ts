import { browser } from '$app/environment'
import { client } from '$lib/api/client.svelte'

const PAGE_SIZE = 50
const MAX_PAGES = 20
const CACHE_TTL = 30 * 60 * 1000

export interface Karma {
  post: number
  comment: number
  total: number
  partial: boolean
}

interface CacheEntry {
  at: number
  karma: Karma
}

const cacheKey = (instance: string, username: string) =>
  `karma:${instance}:${username.toLowerCase()}`

function readCache(key: string): Karma | undefined {
  if (!browser) return

  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return

    const entry = JSON.parse(raw) as CacheEntry
    if (!entry?.karma || Date.now() - entry.at > CACHE_TTL) return

    return entry.karma
  } catch {
    return
  }
}

function writeCache(key: string, karma: Karma) {
  if (!browser) return

  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({ at: Date.now(), karma } satisfies CacheEntry),
    )
  } catch {
    /* empty */
  }
}

export async function fetchKarma(
  instance: string,
  username: string,
): Promise<Karma> {
  const key = cacheKey(instance, username)
  const cached = readCache(key)
  if (cached) return cached

  let post = 0
  let comment = 0
  let exhausted = false

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await client({ instanceURL: instance }).getPersonDetails({
      username: username,
      page: page,
      limit: PAGE_SIZE,
      sort: 'New',
    })

    post += res.posts.reduce((sum, p) => sum + (p.counts?.score ?? 0), 0)
    comment += res.comments.reduce((sum, c) => sum + (c.counts?.score ?? 0), 0)

    if (res.posts.length < PAGE_SIZE && res.comments.length < PAGE_SIZE) {
      exhausted = true
      break
    }
  }

  const karma: Karma = {
    post: post,
    comment: comment,
    total: post + comment,
    partial: !exhausted,
  }

  writeCache(key, karma)
  return karma
}
