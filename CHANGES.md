# Changes from upstream

This fork of [Xyphyn/photon](https://github.com/Xyphyn/photon) is licensed under
AGPL-3.0-only. Section 5(a) of the license requires modified versions to carry
prominent notices stating that they were changed, so every deviation from
upstream is recorded here.

## 2026-08-09 — Working YouTube frontend

Tested every instance the Invidious project lists, plus several from outside it.
Almost none can be embedded any more: `inv.nadeko.net`, `invidious.f5.si` and
`inv.zoomerville.com` sit behind a bot challenge, `invidious.nerdvpn.de` has
switched embedding off, `yt.chocolatemoo53.com` sends `X-Frame-Options: DENY`,
and `yewtu.be` answers with a browser verification page. The rest were dead.

`invidious.tiekoetter.com` returns a real player, sets
`frame-ancestors 'self' file: http: https:`, and is now the default. Also
guarded the settings write that resilience pass missed; exceeding the storage
quota still threw out of that effect.

## 2026-08-09 — Resilience review

Stored state was parsed without any guard, so a single corrupt value made the
app unrecoverable: the parse happens while the module initialises, which means a
blank page with no way to reach the setting that would clear it.

- `theme.data` and `profileData` are now read defensively. A corrupt value falls
  back to defaults instead of throwing, and a `theme.data` missing its `themes`
  array no longer crashes on the spread that follows.
- Writes to local and session storage are guarded too. Exceeding the storage
  quota threw out of an effect rather than being ignored.
- A malformed `PUBLIC_THEME` took the build and every page render down with it.
  It now falls back to the default palette.
- The login form parsed the error body as JSON inside its own catch block, so a
  non-JSON error — a gateway timeout returning HTML, for instance — threw again
  and the user was shown nothing at all.

Lifecycle and optimistic updates:

- The sign-up page started an interval to cycle instance placeholders and never
  cleared it. In a single-page app it kept running after leaving the page, and
  every return added another one.
- A failed vote left the optimistic count and highlight in place, so the vote
  looked recorded when the server had rejected it. Both post and comment votes
  now roll back.
- The "still loading your user data" timer was only cleared on success, so it
  fired after a failure too, contradicting the error that had just been shown.

Smaller items:

- The select menu rendered option labels through `{@html}`. Labels come from
  `innerText`, so the markup did nothing except undo escaping on any label built
  from server data.
- Added `rel` to the one external link that was missing it.

## 2026-08-09 — Correctness and safety review

- The account settings export produced a file containing the literal text
  `[object Object]`. `exportSettings` is declared as returning a string, but the
  Lemmy client parses every response as JSON, so the download was built from an
  object. The declaration now says `unknown` and the caller serialises it.
- Karma lookups could not be cancelled. Moving between profiles left up to
  twenty requests per abandoned profile running against the instance; they are
  now aborted when the page changes.
- Markdown links accepted any URL scheme, so a submission could render
  `[text](javascript:...)`. The content security policy already blocked it from
  executing, but the link is now dropped rather than relying on that alone.
  `http`, `https`, `mailto`, `magnet` and relative links are unaffected.
- `/go?localize=` redirected to whatever URL it was handed when the link was not
  fediverse content, which made the deployment usable as an open redirect for
  phishing. It now returns a 400 instead. Photon's own share links are
  unaffected, since those always resolve.
- The community danger zone rendered for anyone opening a community's settings
  page, including people with no moderator rights. The server rejected the
  requests, but the buttons should not have been there; it is now gated on
  moderator status.

## 2026-08-09 — Deployment cost, defaults and karma

Cloudflare Pages was burning through its daily Functions quota (150k against a
100k limit) while nobody was using the site. Every page request was reaching a
Function: the Cloudflare adapter routes `/*` through the worker, and none of the
pages were prerendered, so bot traffic alone was enough to exhaust the quota.

- On Cloudflare Pages, Photon now builds as a static single-page app unless
  `PUBLIC_SSR_ENABLED=true`. Output still lands in `.svelte-kit/cloudflare`, so
  no project setting has to change, but the deployment contains no `_worker.js`
  and no `_routes.json` and therefore serves no Functions requests. Server-side
  rendering was already off by default, so nothing was lost by prerendering the
  shell instead of generating it per request.
- Added a `_headers` file so immutable assets, fonts and images are cached for a
  long time while the app shell stays revalidated.
- Excluded `_headers`, `_redirects` and `_routes.json` from the service worker
  precache list. Cloudflare consumes those files instead of serving them, so
  `cache.addAll` would have rejected and no service worker would install.
- Tightened `robots.txt`: added the remaining account-scoped routes, a crawl
  delay, and opt-outs for the AI and SEO crawlers that generate most of the
  automated traffic.

Defaults:

- The default instance is now `lemmy.zip`, including the guest profile shown
  before anyone signs in.
- YouTube links embed through Invidious by default, using `inv.nadeko.net`.
- Comments sort by Top by default.
- `PUBLIC_LOCK_TO_INSTANCE` now defaults to `false`, so logging in and signing
  up from any instance works out of the box.
- `PUBLIC_COLORSCHEME` now defaults to `dark`.

User profiles:

- Profiles show a Reddit-style karma figure, the sum of the scores of a user's
  posts and comments. Lemmy dropped `post_score` and `comment_score` from
  `PersonAggregates` in 0.19, so the figure is computed in the browser by
  paging through the user's submissions, capped at 20 pages and cached for the
  session. A user with more submissions than the cap is shown a `+` suffix.
  Turn it off with the "Show karma on profiles" setting or
  `PUBLIC_SHOW_KARMA=false`.

Interface fixes to earlier fork work:

- The account backup section sat inside the discussion-languages block on the
  profile settings page, so it rendered as part of that control. It is now its
  own section and follows the label/description/panel shape the rest of that
  page uses.
- The backup, danger zone and emoji panels used `Material color="distinct"`,
  which is reserved for popovers and overlays, and mixed `prefix` snippets with
  the `icon` prop. They now use the same `uniform` panels and `icon` prop as the
  rest of the app.
- The "Resign as admin" button was placed directly in the page header's
  `extended` snippet, which stretches its children, so it rendered full width.
  It is now wrapped the same way every other header action is.
- Restoring a deleted community no longer redirects away from its settings, and
  the delete action now reflects the state the server reported back.
- `EntityHeader` never passed its `stats.format` flag to `LabelStat`, so the
  formatting opt-out that call sites were already using had no effect.
- Added the missing `form.profile.2fa.enabled` string, which rendered as a raw
  key on the 2FA page whenever 2FA was on.
- The embed host setting was pasted straight into `https://<host>/embed/...`,
  so an address entered with its scheme produced an unusable URL. The scheme
  and any trailing slashes are now stripped.
- Moved the login expiry, missing user data and failed logout messages into the
  translation file. They were the only English strings left in the sign-in
  flow.

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
