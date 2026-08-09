import { browser } from '$app/environment'
import type { CommunityView } from '$lib/api/types'

interface SessionStorage {
  lastSeenCommunity?: CommunityView
  postDraft?: {
    community: CommunityView | null
    title: string
    body?: string
    image: FileList | null
    url?: string
    nsfw: boolean
    loading: boolean
  }
}

export const setSessionStorage = (
  key: keyof SessionStorage,
  value: SessionStorage[typeof key],
) => {
  if (!browser) return

  try {
    if (value == undefined) {
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, JSON.stringify(value))
    }
  } catch {
    /* empty */
  }
}

export const getSessionStorage = (
  key: keyof SessionStorage,
): SessionStorage[typeof key] => {
  if (!browser) return

  try {
    const value = sessionStorage.getItem(key)
    if (!value) return

    return JSON.parse(value)
  } catch {
    return
  }
}
