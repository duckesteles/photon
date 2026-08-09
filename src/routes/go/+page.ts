import { photonify } from '$lib/app/markdown/renderers/plugins'
import { error, redirect } from '@sveltejs/kit'

export async function load({ url }) {
  const link = url.searchParams.get('localize')

  if (!link) return

  const localized = photonify(link)
  if (!localized) error(400, 'That link does not point at fediverse content.')

  redirect(302, localized)
}
