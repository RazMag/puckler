# Puckler

A hockey-loud scoreboard for a crew of friends who each picked an NHL team. It shows:

- **Standings**: your picks ranked against each other (jersey podium, stick-race bars and a full stat table).
- **Divisions**: all four divisions drawn as rinks, with your teams highlighted and the playoff cut line marked.
- **Faceoffs**: every game where two crew picks play each other, plus each team's recent results and next games.
- **Draft Room**: add, rename or remove crew members and their teams. Editing needs the crew password.

Data comes from the public NHL web API (`api-web.nhle.com`). The server fetches it and caches it for about a minute, so no API key is needed.

## Stack

Next.js 16 (App Router, Server Components, Server Actions, Cache Components), React 19, TypeScript, Tailwind CSS v4, zod and Vitest. Picks are saved in a JSON file (`$DATA_DIR/crew.json`).

```
src/
  app/              routes: / · /divisions · /faceoffs · /crew · /api/health
  components/       hockey UI: Jersey, StickBar, Puck, rink/…, GameCard
  lib/nhl/          API client, zod schemas, normalization, team colors
  lib/crew/         crew store (JSON file) + guarded server actions
  lib/auth/         signed editor cookie, login/logout actions
  lib/domain/       pure logic: crew ranking, playoff status, rivalries
  lib/glossary.ts   plain-English explanations behind every tooltip
```

## Develop

```bash
npm install
cp .env.example .env.local   # set CREW_PASSWORD and SESSION_SECRET
npm run dev                  # http://localhost:3000
```

```bash
npm test          # domain + token tests (against captured API fixtures)
npm run lint
npm run typecheck
npm run format
```

## Run with Podman (Quadlet)

Build the image:

```bash
podman build -t puckler -f Containerfile .
```

Create the two secrets once:

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
```

The site is on port 3000. Picks live in the `puckler-data` volume, so they survive rebuilds. To ship a new version, rebuild the image and run `systemctl --user restart puckler`.

For a rootless service to start at boot without anyone logged in, run `loginctl enable-linger $USER`.

### Notes

- The login cookie gets the `Secure` flag when the browser reaches the site over HTTPS (directly or through a TLS-terminating proxy). Plain-HTTP LAN access still works.
- Changing the `puckler-session` secret signs everyone out.
- Failed logins are throttled per client IP (`X-Forwarded-For` when behind a proxy).
