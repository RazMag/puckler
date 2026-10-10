# Puckler

A hockey-loud scoreboard for a crew of friends who each picked an NHL team. It shows:

- **Standings**: your picks ranked against each other (jersey podium, stick-race bars and a full stat table).
- **Divisions**: all four divisions drawn as rinks, with your teams highlighted and the playoff cut line marked.
- **Faceoffs**: every game where two crew picks play each other, plus each team's recent results and next games.
- **Players**: who's carrying each crew team. The crew's "three stars" over the last five games, each team's top scorers with their recent form, its goalies, and its injury report with key players flagged.
- **Draft Room**: add, rename or remove crew members and their teams. Editing needs the crew password.

Data comes from the public NHL web API (`api-web.nhle.com`). The server fetches it and caches it for about a minute, so no API key is needed. The NHL API has no injury data, so the injury report comes from ESPN's public site API, refreshed every 15 minutes. If ESPN is unreachable, the Players page still loads and says the injury report is unavailable.

## Stack

Next.js 16 (App Router, Server Components, Server Actions, Cache Components), React 19, TypeScript, Tailwind CSS v4, zod and Vitest. Picks are saved in a JSON file (`$DATA_DIR/crew.json`).

```
src/
  app/              routes: / · /divisions · /faceoffs · /players · /crew · /api/health
  components/       hockey UI: Jersey, StickBar, Puck, rink/…, GameCard
  lib/nhl/          API client, zod schemas, normalization, team colors
  lib/espn/         injury report (the one feed that isn't from the NHL)
  lib/crew/         crew store (JSON file) + guarded server actions
  lib/auth/         signed editor cookie, login/logout actions
  lib/domain/       pure logic: crew ranking, playoff status, rivalries, player form
  lib/glossary.ts   plain-English explanations behind every tooltip
```

## Develop

With [just](https://github.com/casey/just):

```bash
just dev
```

This installs dependencies if needed and asks for the Draft Room password. Press Enter to keep the current one. It then writes `.env.local` (with a fresh session secret whenever the password changes) and starts the dev server on http://localhost:3000. `just password` changes the password without starting the server.

```bash
just check        # lint, type-check, tests, formatting
just image        # podman build
```

Without `just`: copy `.env.example` to `.env.local`, fill in `CREW_PASSWORD` and `SESSION_SECRET`, then `npm install && npm run dev`.

## Run with Podman (Quadlet)

CI (`.github/workflows/ci.yml`) runs the checks and publishes the image to GitHub Container Registry:

| Tag                                    | When                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| `ghcr.io/razmag/puckler:latest`        | every push to `main` (what the Quadlet unit runs)                                     |
| `ghcr.io/razmag/puckler:sha-<commit>`  | every push to `main`, for pinning or rolling back                                     |
| `ghcr.io/razmag/puckler:1.2.3`, `:1.2` | the first push to `main` with that `version` in `package.json`, or a `v1.2.3` git tag |

From `main`, each version tag is published once: if `main` gets new commits without a version bump, CI warns and only moves `latest`, so `:1.2.3` always points at the build that introduced it. See `AGENTS.md` for when to bump.

Pull requests build the image too, without pushing it.

### One-time setup on the server

The repository is private, so its image is too. Create a [personal access token](https://github.com/settings/tokens) with only the `read:packages` scope, and log in. Save the login under `~/.config` so it survives reboots:

```bash
podman login ghcr.io --username <github-user> --authfile ~/.config/containers/auth.json
```

Create the two secrets:

```bash
printf '%s' 'your crew password' | podman secret create puckler-password -
openssl rand -base64 32 | tr -d '\n' | podman secret create puckler-session -
```

Install the Quadlet units (rootless shown) and start the service:

```bash
mkdir -p ~/.config/containers/systemd
cp deploy/puckler.container deploy/puckler-data.volume ~/.config/containers/systemd/
systemctl --user daemon-reload
systemctl --user start puckler
loginctl enable-linger $USER   # start at boot without anyone logged in
```

The site is on port 3000. Picks live in the `puckler-data` volume, so they survive updates.

### Updates

The unit has `AutoUpdate=registry`, so Podman can pull a newer `:latest` and restart the service on its own. Turn on the daily timer:

```bash
systemctl --user enable --now podman-auto-update.timer
```

Or update by hand with `podman auto-update`. If a new image fails to start, Podman rolls back to the previous one. To pin a version, set `Image=ghcr.io/razmag/puckler:sha-<commit>` (or a release tag) and remove `AutoUpdate`.

### Building locally instead

```bash
just image   # podman build -t puckler -f Containerfile .
```

Then set `Image=localhost/puckler:latest` in the unit, remove `AutoUpdate=registry`, and restart with `systemctl --user restart puckler` after each rebuild.

### Notes

- The login cookie gets the `Secure` flag when the browser reaches the site over HTTPS (directly or through a TLS-terminating proxy). Plain-HTTP LAN access still works.
- Changing the `puckler-session` secret signs everyone out.
- Failed logins are throttled per client IP (`X-Forwarded-For` when behind a proxy).
