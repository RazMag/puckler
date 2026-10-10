<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Versioning

`package.json` holds the app version (semver). The first push to `main` with a new version publishes the container image as `:<version>` and `:<major>.<minor>`. A push without a bump only updates `:latest` and CI warns, so a missed bump means that change never gets a version tag.

Bump the version in the same branch as any change to what ships in the image: anything under `src/` or `public/`, dependencies, `next.config.ts` or the `Containerfile`.

- **Patch** (1.1.0 → 1.1.1): fixes and refactors with no new behavior (`fix`, `perf`, `refactor`).
- **Minor** (1.1.0 → 1.2.0): new features (`feat`).
- **Major** (1.1.0 → 2.0.0): changes that need action from whoever runs the app, such as a new required env var, a `crew.json` format change or a change to the deploy units.

Changes to docs, CI, tests or dev tooling alone don't need a bump.

- One bump per branch, sized by its biggest change. If `main` reached that version or higher while the branch was open, bump again from `main`'s version.
- Run `npm version <x.y.z> --no-git-tag-version` so `package.json` and `package-lock.json` change together.
- Commit the bump on its own as `chore: bump version to <x.y.z>`.
