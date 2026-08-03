import { env } from '$env/dynamic/public'

/**
 * Photon is AGPL-3.0-only. Section 13 requires that users interacting with a
 * modified version over a network are offered its Corresponding Source, so this
 * link must stay reachable from the UI of every deployment.
 */
export const SOURCE_URL =
  env.PUBLIC_SOURCE_URL || 'https://github.com/duckesteles/photon'
