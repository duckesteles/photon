import { client } from '$lib/api/client.svelte'
import { profile } from '$lib/app/auth'
import { ReactiveState } from '$lib/app/util.svelte'

export async function load({ fetch }) {
  const { jwt } = profile.current

  const res = await client({ func: fetch, auth: jwt }).getBannedPersons()

  return { banned: new ReactiveState(res.banned) }
}
