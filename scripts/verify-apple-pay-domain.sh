#!/usr/bin/env bash
# Pass 29 A4 — Verify Apple Pay domain association is being served
# correctly from production before clicking "Verify" in the Stripe
# Dashboard. Catches the common failure modes: 404 (rewrite rule
# misconfigured), 301/302 (vercel.json sends /.well-known/* through
# the SPA fallback instead of static), or wrong content (the file
# was overwritten with a placeholder during a deploy).
#
# Usage:
#   ./scripts/verify-apple-pay-domain.sh                 # checks vettit.ai
#   ./scripts/verify-apple-pay-domain.sh staging.vettit.ai

set -euo pipefail

DOMAIN="${1:-vettit.ai}"
URL="https://${DOMAIN}/.well-known/apple-developer-merchantid-domain-association"
LOCAL_FILE="$(dirname "$0")/../public/.well-known/apple-developer-merchantid-domain-association"

echo "→ Checking ${URL}"

# 1. HTTP status
status=$(curl -sI -o /dev/null -w '%{http_code}' "$URL")
if [[ "$status" != "200" ]]; then
  echo "FAIL — expected HTTP 200, got $status"
  echo "  Likely cause: vercel.json rewrite rule for /.well-known/* is missing"
  echo "  or the SPA-fallback rewrite is matching this path first."
  exit 1
fi
echo "✓ HTTP 200"

# 2. Content-Type — Apple wants no special MIME; text/plain or
#    application/octet-stream both work. We just want NOT html.
ctype=$(curl -sI "$URL" | awk -F': ' 'tolower($1)=="content-type"{print tolower($2)}' | tr -d '\r\n')
if [[ "$ctype" == *"text/html"* ]]; then
  echo "FAIL — Content-Type is text/html (the SPA fallback is serving the index)"
  exit 1
fi
echo "✓ Content-Type: $ctype"

# 3. Size + content sanity vs the committed file. If the response
#    is tiny (< 1 KB) it's almost certainly a placeholder or 404
#    body that returned 200 by accident.
remote_size=$(curl -sI "$URL" | awk -F': ' 'tolower($1)=="content-length"{print $2}' | tr -d '\r\n')
if [[ -z "$remote_size" ]]; then
  remote_size=$(curl -s "$URL" | wc -c | tr -d ' ')
fi
if (( remote_size < 1000 )); then
  echo "FAIL — response is only ${remote_size} bytes; expected >= 9000."
  echo "  The deployed file looks like a placeholder or stub."
  exit 1
fi
echo "✓ Size: ${remote_size} bytes"

if [[ -f "$LOCAL_FILE" ]]; then
  local_size=$(wc -c < "$LOCAL_FILE" | tr -d ' ')
  if [[ "$local_size" != "$remote_size" ]]; then
    echo "WARN — committed file is ${local_size} bytes but production serves ${remote_size}."
    echo "  Verify Vercel deployed the latest commit."
  else
    echo "✓ Production size matches committed file"
  fi
fi

# 4. Spot-check the first bytes look like the Apple JSON-encoded hex
#    blob (starts with the hex of '{"pspId":"...').
first8=$(curl -s "$URL" | head -c 8)
if [[ "$first8" != "7B227073"* ]]; then
  echo "WARN — first bytes don't match the expected Apple blob signature."
  echo "  Got: ${first8}"
fi

echo ""
echo "All checks passed. You can now register this domain in Stripe Dashboard:"
echo "  Settings → Payment methods → Apple Pay → Add new domain → ${DOMAIN}"
