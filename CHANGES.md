# Changes from upstream

This fork of [Xyphyn/photon](https://github.com/Xyphyn/photon) is licensed under
AGPL-3.0-only. Section 5(a) of the license requires modified versions to carry
prominent notices stating that they were changed, so every deviation from
upstream is recorded here.

## 2026-08-04 — Lemmy API coverage

Audited Photon against the route definitions of Lemmy 0.19.20 and closed the
gaps found. Of the 101 API endpoints, 91 were reachable; the client interface
now declares all of them except `POST /site`, which only bootstraps an empty
instance and cannot succeed against a configured one.

- Logging out now ends the session on the instance. Previously the profile was
  only dropped from local storage, leaving the token valid server side.
- Added `validateAuth`, and used it to tell an expired login apart from an
  instance that is failing to return user data.
- Added `exportSettings` and `importSettings`, with a backup section on the
  account settings page. Exports are built and read entirely in the browser.
- Added `transferCommunity`, `leaveAdmin`, and custom emoji management to the
  client interface.
- Wired community delete, remove and hide into a confirmed danger zone on the
  community settings page, and community ownership transfer into the moderator
  list.
- Added editing for sent direct messages.
- Added admin pages for banned users and for custom emoji management.
- Added an option for an admin to resign.
- Reviewed registration applications are now read back from the server instead
  of being patched locally from a guess at what changed.

Fixed type errors that predate this work, so the project checks clean:

- `FeedTypes['/f/[id]']` described a response the route never returned. It named
  a `multi: GetMultiCommunityResponse` field, but the loader returns
  `feed: Promise<FeedView | undefined>`, mirroring `/topic/[id]`. The referenced
  type did not exist at all.
- Two `resolve()` calls named the route `/comment/[instance]/[id]`, which does
  not exist. The directory is `[id=integer]`, so the calls fell back to an
  overload that takes no parameters.
- Moved `donation_dialog_shown` off a raw `fetch` and onto the client.
- Removed the `getPostReplies` declaration. It named a request type that does
  not exist, no adapter implemented it and nothing called it, so it could never
  compile. This clears two of the type errors that were already present.

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
