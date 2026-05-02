---
title: Refund Policy
slug: refunds
effective_date: TBD
last_updated: 2026-05-02
status: draft
governing_law: UAE
---

# Refund Policy

**Status:** DRAFT — pending Jamil review (Sub-rule 6). Do not publish.

> This is a one-time draft to bootstrap the `/refunds` route. It reflects how VETT actually handles refunds as of 2026-05-02. It is not a substitute for review by qualified legal counsel before public launch.

---

## Plain-English summary

- **If a mission fails for a reason within our control, we refund you automatically — no email needed.** Stripe takes 5–10 business days to return the money to your card.
- **We do not refund delivery quality complaints.** If we delivered the qualified respondent count you paid for, the mission is delivered. If you think the AI got the analysis wrong, email us and we'll review.
- **We do not refund completed missions on a change of mind.**
- **Edge cases get reviewed by a human.** If something feels off, email [hello@vettit.ai](mailto:hello@vettit.ai) and we'll work it out.

---

## 1. The "10 = 10 qualified" delivery contract

VETT promises a specific thing: the number of respondents you pay for is the number of **qualified** respondents we deliver. We use constraint-based persona generation, so respondents are produced to satisfy your screening criteria on the first try.

If we deliver the qualified count you paid for, the mission is delivered — even if you don't love the conclusions in the report. We will look at quality complaints case-by-case (see Section 4 below), but they are not automatic refunds.

## 2. Automatic refunds — when they fire

VETT issues a **full automatic refund** if any of the following happens **after you paid** for a mission:

| Failure mode | Why it triggers a refund |
|---|---|
| AI provider rejects the request (e.g. invalid input, format mismatch, content moderation) | We can't deliver |
| Infrastructure error during analysis (database write fault, storage failure, timeout) | We can't deliver |
| Parse fault (the AI returned a malformed response we cannot use) | We can't deliver |
| Mission stalled longer than the platform timeout (~10 minutes typical) | We can't deliver |
| Pre-flight validation rejected the mission after payment landed (rare) | We can't deliver |

How it works in practice:

- The mission row is marked `failed` in the database with a `failure_reason`.
- A refund is issued via Stripe using an idempotent key (`auto_refund:<missionId>`) so we never double-refund.
- The refund amount, the Stripe refund ID, and the failure reason are stored on the mission record.
- An admin alert is created so we can investigate the root cause.
- An email confirming the refund is sent to your account email.
- The `/results/<missionId>` page surfaces a clear failure card with the refund amount and a link to start a new mission.

You don't need to email us. You don't need to chase the refund. Stripe takes 5–10 business days to return funds to the original payment method, depending on your bank.

## 3. Manual refunds — when to email us

The automatic flow handles the common failure modes. Edge cases need a human:

- **Stripe couldn't issue an automatic refund** — for example, the original payment method was closed or revoked between purchase and failure. Email [hello@vettit.ai](mailto:hello@vettit.ai); we'll arrange an alternative refund method.
- **A mission completed but a Stripe webhook never reached us** — extremely rare, but possible. If you see a charge with no mission, email us with the Stripe receipt and we will reconcile.
- **Duplicate charges** — if you were billed twice for the same mission (e.g. browser back-button retry), email us with both receipt numbers; we will refund the duplicate.
- **Material AI quality complaint** — see Section 4.

For any manual refund, email [hello@vettit.ai](mailto:hello@vettit.ai) within 30 days of the charge with:
- The mission ID (visible on the results page or the email receipt)
- A short description of what went wrong
- A screenshot if it's a UI / output issue

We will respond within 1 business day (UAE time) and resolve the request within 5 business days unless the situation needs deeper investigation, in which case we'll tell you the timeline.

## 4. Quality complaints — what we will and won't do

Quality complaints are not delivery failures. The qualified count was delivered; the disagreement is about the analysis itself.

**We will:**

- Re-read the AI output against the brief you supplied and tell you whether we agree the response was off.
- If the AI clearly missed an explicit instruction in the brief (e.g. you asked for ages 25–34 and the synthesis ignored that), we'll either re-run the analysis at our cost or refund the mission, our choice.
- If the AI surfaced an answer that contradicts the input data we showed it (a real model error), same outcome — re-run or refund.

**We won't:**

- Refund because you disagree with a recommendation. AI outputs are decision-support; you should validate big calls with primary research.
- Refund because the result wasn't what you hoped for. "We expected the audience to love it and they didn't" is information, not a defect.
- Refund because a synthetic respondent distribution didn't match your read of the real population. Synthetic respondents are calibrated to demographic and behavioural distributions; they will sometimes diverge from a specific local sub-population. That is by design and disclosed in the [Terms of Service](./TERMS_OF_SERVICE.md).

## 5. What we don't refund

- **Completed missions on a change of mind.** Once the analysis is delivered to your dashboard, the mission is fulfilled.
- **Stripe processing fees on a successful payment that was later refunded automatically.** Stripe does not return their fee to us; the rest of the charge is returned to you in full.
- **Currency-conversion losses.** If you paid in a currency different from your card's billing currency, your bank's spread between the purchase and the refund may produce a small difference. That is between you and your bank; we refund the original USD amount we charged.
- **Costs you incurred relying on a VETT analysis.** See Section 11 of the [Terms of Service](./TERMS_OF_SERVICE.md) — we don't pay consequential damages.
- **Tax / VAT differences** — refunded together with the principal where the tax was charged.

## 6. Account closure refunds

If you close your account while a mission is in progress, that mission is cancelled and refunded. If the mission has already completed, no refund is owed (the work was delivered).

## 7. Chargebacks

If you initiate a chargeback before contacting us, we will:

- Provide the documentation Stripe requests (mission record, delivery confirmation, output) and let the bank decide.
- Suspend further service on the account during the dispute.
- After resolution, restore the account if the chargeback was legitimate, or close the account if the chargeback was fraudulent.

We strongly prefer that you email [hello@vettit.ai](mailto:hello@vettit.ai) before raising a chargeback. Almost every legitimate refund situation can be resolved in 1–2 emails without involving the bank.

## 8. Currency, tax, and processing time

- **Currency:** refunds are issued in the same currency you were charged in.
- **Tax:** any tax / VAT charged is refunded in the same proportion.
- **Stripe processing time:** 5–10 business days for funds to return to your card. Your bank may take longer to surface the refund in your statement, particularly across borders or weekends.
- **Original payment method only:** automatic refunds go back to the same card / bank that paid. Alternative refund methods (manual, on request) are reviewed case by case.

## 9. How to check your refund status

- The `/results/<missionId>` page shows the refund amount and refund ID once the auto-refund has been issued.
- Stripe sends a refund email to the same address that paid.
- Your card statement will show a credit within 5–10 business days.

If 10 business days pass with no credit on the statement, email [hello@vettit.ai](mailto:hello@vettit.ai) with the mission ID and Stripe refund ID; we will trace it with Stripe.

## 10. Changes to this policy

We may update this policy as the product evolves. Material changes are emailed to active accounts at least 14 days before taking effect. Non-material changes (typos, clarifications) take effect on the `last_updated` date in the header.

## 11. Contact

[hello@vettit.ai](mailto:hello@vettit.ai)

---

_See also: [Privacy Policy](./PRIVACY_POLICY.md), [Terms of Service](./TERMS_OF_SERVICE.md)._
