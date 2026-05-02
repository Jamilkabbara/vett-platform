---
title: Privacy Policy
slug: privacy
effective_date: TBD
last_updated: 2026-05-02
status: draft
governing_law: UAE
---

# Privacy Policy

**Status:** DRAFT — pending Jamil review (Sub-rule 6). Do not publish.

> This is a one-time draft to bootstrap the `/privacy` route. It reflects how VETT actually handles data as of 2026-05-02. It is not a substitute for review by qualified legal counsel before public launch, especially given the cross-border data flows and overlapping privacy regimes (UAE PDPL, EU GDPR, MENA jurisdictional rules).

---

## Plain-English summary

VETT is an AI market research platform. We need very little personal data to run, and we go out of our way to never collect data about the people who appear in your research. Specifically:

- **You** — the account holder — give us your email, payment details (handled by Stripe), and the briefs / creatives you upload for analysis. We need that to run the product.
- **Your "respondents"** — the personas the AI generates for your missions — are synthetic. They are not real people. We do not collect, buy, or scrape data about real humans to populate them. There is no human respondent panel behind the scenes.
- **Your inputs** — text briefs, uploaded creatives, brand context — are processed by our AI (Anthropic Claude) to generate insights. The AI provider has its own data handling terms; see "Sub-processors" below.
- **You can ask us to delete your account and everything in it at any time** by emailing [hello@vettit.ai](mailto:hello@vettit.ai). We will action the request within 30 days.

The rest of this document is the formal version.

---

## 1. Who we are

This privacy notice applies to:

- **Service:** VETT, available at [vettit.ai](https://www.vettit.ai/) and [www.vettit.ai](https://www.vettit.ai/).
- **Operator:** _[Legal entity name and registration number to be inserted before publication.]_
- **Operator location:** United Arab Emirates.
- **Contact for privacy questions:** [hello@vettit.ai](mailto:hello@vettit.ai).

If you are an EU/EEA, UK, or Swiss data subject and you would prefer to communicate with a designated representative, please contact us at the address above and we will direct you to the appropriate party.

## 2. What this notice covers

This notice covers personal data that we collect, store, and process when you:

- Create an account on VETT.
- Use VETT to run missions (research projects).
- Pay for missions or other VETT services.
- Contact us for support.
- Visit our marketing pages without an account.

It does NOT cover the synthetic respondent personas that VETT generates for your missions. Those personas are not real people; they are AI-produced statistical objects modelled on aggregate demographic and behavioural distributions. No real human is identified by them.

## 3. What personal data we collect

### 3.1 Information you give us directly

- **Account information:** email address, name (optional), and a password hash. We never see your raw password.
- **Profile information:** company name, location, role (all optional).
- **Mission inputs:** text briefs you write, target audience descriptions, screening questions, brand context, and any creatives (images, videos) you upload for analysis.
- **Payment details:** processed entirely by Stripe. We receive a token, payment status, and metadata (last 4 digits of card, brand, country) — we never see your full card number, CVC, or bank credentials.
- **Support messages:** anything you send to [hello@vettit.ai](mailto:hello@vettit.ai).

### 3.2 Information we collect automatically

- **Authentication state:** your active session, cookies necessary to keep you signed in, and CSRF tokens. These are first-party and essential to the service.
- **Usage telemetry:** pages you visit on VETT, which buttons you click, which missions you create, error events. Used to debug the product and prioritise improvements.
- **Device/browser information:** browser version, operating system, screen size, IP address, approximate country derived from IP.
- **Performance metrics:** anonymous aggregate via Vercel Analytics (no third-party advertising cookies).

### 3.3 Information we do NOT collect

- **Real human respondent data.** Synthetic personas are AI-generated; we do not maintain a panel of real respondents.
- **Third-party browsing.** We do not track you across other websites.
- **Sensitive categories** — health, biometric, sexual orientation, religious belief, political affiliation — are not collected unless you put them in a brief or upload them as a creative for analysis.

## 4. Why we collect it (legal bases)

We process personal data on the following legal bases (UAE PDPL Article 4, EU GDPR Article 6):

| Purpose | Legal basis |
|---|---|
| Run your account, deliver missions you paid for | Performance of contract |
| Take and process payments | Performance of contract |
| Send transactional emails (mission ready, refund issued, password reset) | Performance of contract |
| Detect fraud, abuse, illegal use | Legitimate interest |
| Improve the product (aggregate analytics) | Legitimate interest |
| Marketing emails outside the transactional flow | Consent (you can opt out at any time) |
| Comply with tax / accounting / legal requests | Legal obligation |

## 5. How long we keep it

| Data | Retention |
|---|---|
| Active account data | For the lifetime of your account |
| Mission inputs (briefs, uploads) | For the lifetime of your account |
| Mission outputs (analysis, exports) | For the lifetime of your account |
| Payment records | 7 years after last payment (UAE accounting requirements) |
| Support emails | 3 years after last interaction |
| Authentication / session logs | 90 days |
| Application error logs | 90 days |
| Marketing email opt-in records | Until you opt out + 12 months for audit |

When you delete your account, we wipe the active dataset within 30 days. Payment and accounting records are retained per the table above because we are legally required to.

## 6. Sub-processors

VETT relies on the following infrastructure and service providers to operate. Each has its own privacy and data handling terms; we list them so you can review independently.

| Provider | Purpose | Region | Their privacy notice |
|---|---|---|---|
| Supabase | Database + authentication + file storage | ap-south-1 (Mumbai) | https://supabase.com/privacy |
| Anthropic | AI processing (Claude API) | United States | https://www.anthropic.com/legal/privacy |
| Stripe | Payment processing | United States + global | https://stripe.com/privacy |
| Resend | Transactional email delivery | United States | https://resend.com/legal/privacy-policy |
| Vercel | Frontend hosting + analytics | United States + global edge | https://vercel.com/legal/privacy-policy |
| Railway | Backend application hosting | United States | https://railway.com/legal/privacy |

Cross-border transfers to these providers are required to operate the service. Where data leaves the country you reside in, we rely on the provider's standard contractual clauses or equivalent transfer safeguards.

## 7. Cookies and similar technologies

VETT uses a small number of cookies and browser-storage entries:

| Name | Purpose | Type |
|---|---|---|
| Supabase auth tokens | Keep you signed in | Essential |
| `vett_session_id` | Funnel telemetry stitching across page loads | Essential |
| `vett_funnel_queue` | Buffers analytics events when offline | Essential |
| `vett:mission_draft` | Saves an in-progress mission draft locally | Essential |
| `vett_landing_goal` | Carries a landing-page CTA selection through sign-in | Essential |
| `vett_dashboard_banner_dismissed` | Remembers that you dismissed the dashboard banner | Functional |
| Vercel Analytics | Aggregate page-view metrics, no individual tracking | Analytics |

We do not run third-party advertising cookies, retargeting pixels, or fingerprinting libraries. We do not sell or rent any data to advertisers.

If a cookie banner is in effect on your jurisdiction, you can decline non-essential cookies. Essential cookies cannot be disabled — without them you cannot sign in or save a mission draft.

## 8. Your rights

Depending on where you live, you may have the right to:

- **Access** the personal data we hold about you (right to a copy).
- **Correct** inaccurate personal data.
- **Delete** your data (right to erasure / "right to be forgotten").
- **Export** your data in a machine-readable format (data portability).
- **Object** to certain processing (e.g. marketing emails).
- **Restrict** processing in some circumstances.
- **Withdraw consent** at any time where processing relies on consent.
- **Lodge a complaint** with your local data protection authority.

To exercise any of these rights, email [hello@vettit.ai](mailto:hello@vettit.ai) from the email address tied to your account. We action requests within 30 calendar days. We will not charge you for the first request in any 12-month period.

If you are an EU/EEA data subject and you are not satisfied with our response, you may complain to the supervisory authority in your member state.

## 9. Security

We protect personal data using:

- **Transport encryption** — all traffic to and from VETT uses HTTPS / TLS.
- **Encryption at rest** — Supabase database, file storage, and Stripe payment metadata are encrypted at rest by the provider.
- **Access controls** — only authorised VETT personnel can access production systems, and access is logged.
- **Row-level security** — every database query in VETT is scoped to the requesting user. You cannot see another user's missions or data.
- **Auto-refund on hard failure** — if a mission you paid for cannot be delivered, the payment is refunded automatically (see the Refund Policy).

No system is perfectly secure. If you become aware of a security issue affecting VETT, please email [hello@vettit.ai](mailto:hello@vettit.ai) so we can investigate.

## 10. Children's data

VETT is not directed at children under 18. We do not knowingly collect personal data from anyone under 18. If you believe a child has created an account, email [hello@vettit.ai](mailto:hello@vettit.ai) and we will delete the account.

## 11. Changes to this notice

We may update this privacy notice from time to time. Material changes (new sub-processor, new category of data, new processing purpose) will be communicated by email to active account holders at least 14 days before the change takes effect. Non-material changes (clarifications, typos) take effect on the `last_updated` date in the document header.

## 12. Contact

Privacy questions, rights requests, or anything else covered by this notice:
[hello@vettit.ai](mailto:hello@vettit.ai)

---

_VETT respects your data, and we expect you to do the same with the data of any real humans whose creative or persona descriptions you upload for analysis. See the [Terms of Service](./TERMS_OF_SERVICE.md) for the rules around uploaded content._
