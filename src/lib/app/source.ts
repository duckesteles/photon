import { env } from '$env/dynamic/public'

export const SOURCE_URL =
  env.PUBLIC_SOURCE_URL || 'https://github.com/duckesteles/photon'
