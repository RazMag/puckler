# List recipes
default:
    @just --list

# Start the dev server, choosing the crew password first
dev: install password
    npm run dev

# Install dependencies when they're missing or out of date
install:
    #!/usr/bin/env bash
    set -euo pipefail
    if [[ ! -d node_modules || package-lock.json -nt node_modules ]]; then
        npm install
    fi

# Choose the Draft Room password (writes .env.local, keeps other settings)
password:
    #!/usr/bin/env bash
    set -euo pipefail
    env_file=.env.local
    touch "$env_file"
    current=$(grep -E '^CREW_PASSWORD=' "$env_file" | head -n1 | cut -d= -f2- || true)

    if [[ -n "$current" ]]; then
        read -rsp "Crew password (Enter keeps the current one): " password; echo
    else
        read -rsp "Choose a crew password for the Draft Room: " password; echo
    fi

    if [[ -z "$password" ]]; then
        if [[ -n "$current" ]] && grep -qE '^SESSION_SECRET=.+' "$env_file"; then
            echo "Keeping the current password."
            exit 0
        fi
        [[ -n "$current" ]] || { echo "The password can't be empty." >&2; exit 1; }
    fi
    if [[ "$password" == *"'"* ]]; then
        echo "Please choose a password without single quotes." >&2
        exit 1
    fi

    # A new password also gets a new session secret, which signs everyone out.
    secret=$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))")
    if [[ -n "$password" ]]; then
        value=${password//\$/\\\$}  # Next's env loader expands $VAR even in single quotes
    else
        value=${current#\'}
        value=${value%\'}
    fi
    { grep -vE '^(CREW_PASSWORD|SESSION_SECRET)=' "$env_file" || true; } > "$env_file.tmp"
    printf "CREW_PASSWORD='%s'\nSESSION_SECRET=%s\n" "$value" "$secret" >> "$env_file.tmp"
    mv "$env_file.tmp" "$env_file"
    chmod 600 "$env_file"
    echo "Saved to $env_file."

# Lint, type-check, test and check formatting
check:
    npm run lint
    npm run typecheck
    npm test
    npm run format:check

# Build the container image
image:
    podman build -t puckler -f Containerfile .
