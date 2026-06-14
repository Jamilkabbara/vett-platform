VETT Brand Assets — drop into vett-platform/public/

Files:
- logo.svg               — Source of truth (lime rounded square + Zap icon)
- favicon-16.png         — 16×16 browser tab icon
- favicon-32.png         — 32×32 browser tab icon
- logo-120.png           — 120×120 for Google OAuth consent screen
- apple-touch-icon.png   — 180×180 for iOS home screen bookmark
- og-image.png           — 1200×630 social share card (LinkedIn, Twitter, etc.)

Installation:
1. Copy all files to vett-platform/public/ (root of the public directory)
2. Commit + push — Vercel auto-deploys
3. Verify: curl -sI https://vettit.ai/og-image.png should return 200 image/png

The index.html meta tags Claude Code shipped in commit cae66e1 already reference 
these exact filenames, so no further code changes needed after dropping them in.

Verify the OG card renders correctly by pasting https://vettit.ai into LinkedIn's 
post composer or using https://www.opengraph.xyz to preview.

Brand tokens used:
- Background: #0B0C15
- Lime accent: #BEF264
- Tagline text: "AI-powered market research"
- Font: Poppins Bold/Medium (proxy for Inter — indistinguishable at display sizes)

Generated Apr 21, 2026 via generate_logos.py in Claude sandbox.
