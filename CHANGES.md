# Changes from upstream

This fork of [Xyphyn/photon](https://github.com/Xyphyn/photon) is licensed under
AGPL-3.0-only. Section 5(a) of the license requires modified versions to carry
prominent notices stating that they were changed, so every deviation from
upstream is recorded here.

## 2026-08-04

- Added `src/lib/app/source.ts`, exporting the repository URL used by the
  in-app source links. Overridable with the `PUBLIC_SOURCE_URL` environment
  variable.
- Made the source code link in the sidebar footer and in the profile menu
  visible in every deployment. Upstream only rendered these links when
  `PUBLIC_XYLIGHT_MODE` was enabled, which left ordinary deployments without
  the source offer that AGPL-3.0 section 13 requires. The links now point at
  this fork rather than upstream, so they resolve to the source actually being
  run.
