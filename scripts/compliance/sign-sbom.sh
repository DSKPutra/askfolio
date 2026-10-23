#!/usr/bin/env bash
# © 2026 Dea Saka Kurnia Putra. All rights reserved.
# Sign every SBOM file and SHA256SUMS with Sigstore cosign (keyless, OIDC). Intended for GitHub Actions
# (.github/workflows/compliance.yml, permissions: id-token: write); locally it needs an interactive OIDC login.
set -euo pipefail
VERSION=$(node -p "require('./package.json').version")
DIR="public/sbom/${VERSION}"
command -v cosign >/dev/null || { echo "cosign not installed (compliance.yml installs it)"; exit 1; }
for f in "$DIR"/*.json "$DIR/SHA256SUMS"; do
  cosign sign-blob --yes --bundle "${f}.sigstore.json" "$f" >/dev/null
  echo "signed $(basename "$f")"
done
