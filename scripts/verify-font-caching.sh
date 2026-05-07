#!/usr/bin/env bash
# Pass 30 A1 — Verify Google Fonts WOFF2 files served from
# fonts.gstatic.com carry long-cache headers per perf-LCP-004.
#
# Hits the GFonts CSS, extracts a sample woff2 URL, then HEADs the
# WOFF2 to confirm Cache-Control: public, max-age=... and at least
# 30 days of cache validity. Google sets a year by default, but we
# flag any deploy where this changes (e.g. if we switch CDNs).
#
# Usage:
#   ./scripts/verify-font-caching.sh                 # checks vettit.ai
#   ./scripts/verify-font-caching.sh staging.vettit.ai

set -euo pipefail

DOMAIN="${1:-vettit.ai}"
INDEX_URL="https://${DOMAIN}/"

echo "→ Fetching ${INDEX_URL} to find the GFonts <link>"
gfonts_css_url=$(curl -sL "$INDEX_URL" | grep -oE 'https://fonts\.googleapis\.com/css2[^"'"'"']*' | head -1)
if [[ -z "$gfonts_css_url" ]]; then
  echo "FAIL — couldn't find a fonts.googleapis.com stylesheet link in $INDEX_URL"
  exit 1
fi
echo "✓ Found: $gfonts_css_url"

echo "→ Fetching the GFonts CSS to extract a woff2 URL"
woff2_url=$(curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" "$gfonts_css_url" \
  | grep -oE 'https://fonts\.gstatic\.com/[^)]*\.woff2' | head -1)
if [[ -z "$woff2_url" ]]; then
  echo "FAIL — couldn't extract a woff2 URL from the GFonts CSS"
  echo "  This may mean Google changed the CSS shape; investigate manually."
  exit 1
fi
echo "✓ Sample woff2: $woff2_url"

echo "→ HEAD on the woff2 to read Cache-Control"
cc=$(curl -sI "$woff2_url" | awk -F': ' 'tolower($1)=="cache-control"{print tolower($2)}' | tr -d '\r\n')
if [[ -z "$cc" ]]; then
  echo "FAIL — no Cache-Control header on the woff2 response."
  exit 1
fi
echo "✓ Cache-Control: $cc"

# Extract max-age value
max_age=$(echo "$cc" | grep -oE 'max-age=[0-9]+' | head -1 | grep -oE '[0-9]+' || echo "0")
if [[ -z "$max_age" || "$max_age" -lt 2592000 ]]; then
  echo "FAIL — max-age=${max_age:-<missing>} is below the 30-day floor (2592000s)."
  echo "  Google Fonts normally serves with max-age=31536000 (1 year)."
  echo "  Investigate any CDN change or cache-busting that lowered this."
  exit 1
fi
echo "✓ max-age=${max_age}s ($(echo "scale=1; $max_age/86400" | bc) days)"

# Public + immutable hints? Bonus — not strictly required but desirable.
if echo "$cc" | grep -q public; then
  echo "✓ Cache-Control includes public (shared CDN cache OK)"
fi
if echo "$cc" | grep -q immutable; then
  echo "✓ Cache-Control includes immutable (browser skips revalidation)"
else
  echo "⚠ No immutable hint — browsers may revalidate; not blocking but worth a note."
fi

echo ""
echo "All checks passed. perf-LCP-004 verified for ${DOMAIN}."
