# VETT Legal Pages — Source of Truth

This directory holds the canonical markdown for VETT's legal pages. The frontend's `/privacy`, `/terms`, and `/refunds` routes will render these files (Bug 24.03 frontend ship — separate task; this directory is the content source).

## Files

| File | Public route | Status |
|---|---|---|
| `PRIVACY_POLICY.md` | `/privacy` | 🟡 DRAFT — pending Jamil review |
| `TERMS_OF_SERVICE.md` | `/terms` | 🟡 DRAFT — pending Jamil review |
| `REFUND_POLICY.md` | `/refunds` | 🟡 DRAFT — pending Jamil review |

## Review process (Sub-rule 6 from PASS_24_PROGRESS.md)

> Marketing/sales/legal asset generation requires Jamil review-and-approval before `shipped` status. These are external-facing artifacts where hallucinated facts have reputational cost. Audit chat verifies copy accuracy against real DB / real product behavior; Jamil verifies tone + business positioning.

**Review checklist:**

1. **Audit chat (factual accuracy):**
   - Cross-reference every product claim against the live codebase / DB schema.
   - Specifically verify: pricing tiers match `pricingEngine.ts`, data flow matches Supabase + Anthropic + Stripe + Resend + Vercel + Railway stack, refund mechanics match Bug 23.80 backend.
   - Flag any hallucinated features or stale numbers.

2. **Jamil (tone + positioning + jurisdiction):**
   - Tone matches the rest of the site (direct, founder voice, no boilerplate).
   - Governing law / jurisdiction reflects business reality (UAE).
   - Effective date set to the launch date, not before.
   - Contact email correct.
   - Optional: legal counsel review before public launch (especially for UAE PDPL + EU GDPR coverage). The drafts here are a starting point, not a substitute for that review.

3. **After approval:**
   - Update the status pill in this README from 🟡 DRAFT to ✅ APPROVED.
   - Update `effective_date` in each file's frontmatter to the actual launch date.
   - Frontend ticket (separate from this directory) wires the markdown into `/privacy`, `/terms`, `/refunds` routes via a `react-markdown` renderer.
   - Cookie banner ships with the frontend ticket.

## Frontmatter convention

Every legal markdown file starts with a YAML-style frontmatter block:

```yaml
---
title: <human-readable title>
slug: <route slug>
effective_date: YYYY-MM-DD          # Set to launch date when approved
last_updated: YYYY-MM-DD            # Updated on every content change
status: draft | approved
governing_law: UAE                  # Or whichever jurisdiction we end on
---
```

The frontend renderer reads the frontmatter to populate the page header (title + effective date) and skips it when rendering the body.

## Update protocol

- Substantive changes (new data flow, new vendor, new pricing tier, new mission goal that changes data handling) → update `last_updated` and bump a version line in the body. Notify users via email if the change is material.
- Typo fixes / formatting → just commit; don't bump dates.

## Pending decisions (flag for Jamil)

- **Governing law:** Drafts assume UAE jurisdiction (Jamil's base). Confirm or specify alternative (e.g. Delaware if the company entity is US-incorporated).
- **VAT / sales tax:** Drafts mention UAE 5% VAT may apply for UAE customers. Confirm registered status.
- **Free tier:** Drafts assume no free tier (Phase 2 deferral per `PASS_24_PROGRESS.md`). Update if Phase 2 lands.
- **EU representative (GDPR):** If we're processing EU citizen data at scale, GDPR requires an EU representative. Drafts skip this; revisit when EU traffic justifies it.
- **Data Processing Agreement (DPA):** Enterprise customers will likely request one. Not drafted here; flag for the first enterprise deal.

## Why markdown in `docs/legal/` rather than HTML in `public/`?

- **Diff-able:** Every change is a Git diff anyone can review.
- **Reviewable:** Pull requests work for legal copy the same way they work for code.
- **Render-flexible:** Same markdown can power the public route AND a printable PDF AND a copy-pasteable Slack message.
- **Single source of truth:** The frontend doesn't drift from the canonical text.
