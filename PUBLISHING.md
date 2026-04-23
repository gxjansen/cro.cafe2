# Publishing a new episode

Runbook for when Guido says "publish a new episode" and hands over a Transistor share URL and a YouTube URL.

## TL;DR

An episode is "published on the website" when there is an MDX file in `src/content/episodes/<lang>/season-<N>/episode-<NN>-<slug>.mdx`, the slug matches the Transistor slug, it references existing host/guest slugs, and it is committed to `main`. Netlify auto-deploys from `main`.

The MDX file is the only thing that matters for the website. NocoDB is a separate source-of-truth that feeds the same MDX files via GitHub Actions sync, but you do not need NocoDB to ship a single new episode. Write the MDX by hand, push, done.

## Inputs Guido gives you

- A Transistor share URL, e.g. `https://share.transistor.fm/s/bb21a59a` — the hex after `/s/` is the share code.
- A YouTube URL, e.g. `https://youtu.be/SlP7L_0rrO0`.
- Language (en / nl / de / es), host(s), guest(s).

## Steps

### 1. Pull latest and start a worktree

```bash
cd ~/Documents/Git/cro.cafe2
git fetch origin main
git worktree add ../cro.cafe2-publish-<slug> -b publish-<slug> origin/main
cd ../cro.cafe2-publish-<slug>
```

Never edit `main` directly — there is a hook (`~/.claude/hooks/block-edit-on-main.sh`) that blocks it. This is Guido's global multi-session-safety rule, not a project rule.

### 2. Fetch the episode record from Transistor

Use the Transistor MCP tools. Shows (as of 2026-04):

| Show ID | Slug | Language |
|---|---|---|
| 5036 | cro-cafe | en |
| 16113 | cro-cafe-nl | nl |
| 28592 | cro-cafe-deutsch | de |
| 16111 | cro-cafe-es | es |

```
mcp__transistor__list_episodes(show_id="5036", status="published")
```

Match on `share_url` ending in the share code Guido gave you. Grab: `id` (transistorId), `title`, `number`, `season`, `slug`, `duration`, `published_at`, `media_url`, `image_url`, `video_url`, `description`, `keywords`, `embed_html`, `embed_html_dark`.

### 3. Confirm host and guest slugs exist

```bash
ls src/content/hosts/ | grep <host>
ls src/content/guests/ | grep <guest>
```

If the guest file does not exist, create one (see `src/content/guests/jim-sterne.mdx` as a minimal template — only `name`, `slug`, `bio`, `languages`, `imageUrl`, `socialLinks` are actually required; LinkedIn enrichment fields are filled by sync later).

Drop a headshot at `public/images/guests/<slug>.(png|jpeg|webp)` to match the guest's `imageUrl`.

### 4. Download and convert the episode image

Transistor serves webp via its CDN. Convert to jpg to match the S6+ convention (older episodes inlined the full CDN URL — don't copy that pattern).

```bash
curl -sL "<image_url from Transistor>" -o /tmp/ep.webp
magick /tmp/ep.webp -quality 90 public/images/episodes/<lang>/<slug>.jpg
```

### 5. Write the episode MDX

Path: `src/content/episodes/<lang>/season-<N>/episode-<NN>-<slug>.mdx` where `<NN>` is zero-padded to 3 digits (`episode-002-…`).

Use `src/content/episodes/en/season-6/episode-001-n8n-and-small-ai-models.mdx` as the canonical template. Required frontmatter (from `src/content/config.ts`): `title`, `description`, `pubDate`, `season`, `episode`, `duration`, `audioUrl`, `language`, `transistorId`. Everything else is optional but fill it anyway — the site renders shareUrl, youtubeUrl, embedHtml, keywords, hosts, guests.

`slug` must match the Transistor slug exactly — that's the production URL (`/<lang>/episodes/<slug>/`).

`hosts` and `guests` are arrays of **slug strings**, not names — the episode page joins by `episode.guests.includes(guestSlug)`.

`duration` is a string of seconds, matching Transistor's `duration` field.

`pubDate` uses the Transistor `published_at` timestamp, stripped to second precision.

For the MDX body (below the frontmatter): write a short editorial intro (2-3 paragraphs in Guido's voice — skip the AI-slop summary), the timestamped chapter list, and the links from the Transistor description. The `description` frontmatter block is for the RSS / meta / JSON-LD payload; the body is what renders on the page.

### 6. Backfill the guest's `episodes` array

Guests with `episodes.length === 0` are hidden from `/all/guests` (filter in `src/pages/all/guests.astro:15`). Set:

```yaml
episodeCount: 1
episodes: ["<transistorId>"]
```

The NocoDB sync uses its own internal ID scheme (not Transistor IDs), so the next sync will overwrite this. That's fine — any non-empty array is enough to make the guest visible today.

### 7. Verify and ship

```bash
npm run build          # Astro build — catches schema errors and broken collection refs
```

If the build is clean:

```bash
git add public/images/episodes/<lang>/<slug>.jpg src/content/episodes/<lang>/season-<N>/episode-<NN>-<slug>.mdx src/content/guests/<guest>.mdx
git commit -m "content: publish <lang> S<N>E<NN> — <title>"
git push -u origin publish-<slug>
gh pr create --fill  # or merge directly to main if Guido prefers
```

Netlify deploys from `main`. Verify at `https://www.cro.cafe/<lang>/episodes/<slug>/` and `https://www.cro.cafe/<lang>/guests/<guest>/` once deploy finishes.

### 8. Clean up the worktree

```bash
cd ~/Documents/Git/cro.cafe2
git worktree remove ../cro.cafe2-publish-<slug>
```

## Things that are NOT part of "publishing"

- **NocoDB writes.** The Elestio-hosted NocoDB at `nocodb-nkhcx-u31496.vm.elestio.app` may be unreachable from local DNS anyway. The automated sync (GitHub Actions, every 6h) keeps NocoDB and the repo in agreement over time — but a single manual episode publish does not touch it.
- **n8n webhooks.** The episode-thumbnail-automation workflow is optional and only runs when Guido asks it to.
- **Transistor uploads.** Guido already uploaded the audio and wrote the description on Transistor before asking us to publish. Don't touch `update_episode` unless he asks.
- **YouTube.** Same — the video exists, we only link to it via `youtubeUrl`.

## File map (where things live)

| What | Where |
|---|---|
| Episode content | `src/content/episodes/<lang>/season-<N>/episode-<NN>-<slug>.mdx` |
| Episode image | `public/images/episodes/<lang>/<slug>.jpg` |
| Guest content | `src/content/guests/<slug>.mdx` |
| Guest image | `public/images/guests/<slug>.(png\|jpeg\|webp)` |
| Host content | `src/content/hosts/<slug>.mdx` |
| Content schema | `src/content/config.ts` |
| Episode page route | `src/pages/[lang]/episodes/[slug].astro` |
| Guest page route | `src/pages/[lang]/guests/[slug].astro` |
| Guest→episode join | `src/utils/content.ts` → `getGuestEpisodes` |
