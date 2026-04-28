# Supabase Auth — Branded Email Templates

**Pass 23 Bug 23.32** — branded HTML for the 4 Supabase auth email templates
(Confirm sign-up, Magic link, Reset password, Invite user).

This is a **Jamil-driven configuration task**: the templates can't be
deployed via the Supabase MCP. Paste each block into:

> Supabase Dashboard → Authentication → Email Templates →
> [Confirm signup / Magic link / Reset password / Invite user]

After pasting, also confirm:

- **Sender email**: `hello@vettit.ai`
- **Sender name**: `VETT`
- **Domain**: verified in Resend (already done — same one used for
  `services/email.js` transactional templates)

---

## Shared visual baseline

All four templates use the same VETT dark-theme shell:

- Background `#05060b` outer / `#0B0C15` card
- Lime `#BEF264` accent (top hairline + headings + CTAs)
- Body text `#9ca3af`
- Heading text `#fff`
- Card sub-blocks `#111827` with `#1f2937` borders
- Button: lime background, `#0B0C15` text, 10px radius

The CSS is inlined in each template — Supabase strips `<style>` blocks
(email-client compatibility), and Resend doesn't process external CSS.
This is the same pattern `src/services/email.js::shell()` uses for
transactional emails so the auth + transactional flows feel like one
brand.

Supabase template variables in use:
- `{{ .ConfirmationURL }}` — the unique action link (per template type)
- `{{ .Email }}` — the user's email address
- `{{ .Token }}` — six-digit fallback if templates support it (optional)

---

## 1. Confirm signup

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your VETT account</title></head>
<body style="margin:0;padding:0;background:#05060b;font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#0B0C15;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(90deg,#BEF264 0%,#84cc16 100%);height:6px;"></div>
  <div style="padding:40px;color:#e5e7eb;">
    <div style="font-size:28px;font-weight:800;color:#BEF264;letter-spacing:.08em;">VETT</div>
    <div style="font-size:11px;color:#9ca3af;letter-spacing:.12em;margin-top:2px;">AI-POWERED MARKET RESEARCH</div>
    <div style="height:28px;"></div>
    <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Confirm your email</h1>
    <p style="color:#9ca3af;line-height:1.7;">
      Welcome to VETT. Click the button below to confirm
      <strong style="color:#fff;">{{ .Email }}</strong>
      and finish setting up your account.
    </p>
    <div style="margin:24px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BEF264;color:#0B0C15;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Confirm email →</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      If the button doesn't work, paste this link into your browser:<br>
      <span style="color:#9ca3af;word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-top:20px;">
      Didn't sign up? You can safely ignore this email.
    </p>
    <div style="height:40px;"></div>
    <div style="border-top:1px solid #1f2937;padding-top:20px;font-size:11px;color:#6b7280;line-height:1.7;">
      VETT · vettit.ai · Dubai, UAE
    </div>
  </div>
</div>
</body></html>
```

---

## 2. Magic link

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in to VETT</title></head>
<body style="margin:0;padding:0;background:#05060b;font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#0B0C15;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(90deg,#BEF264 0%,#84cc16 100%);height:6px;"></div>
  <div style="padding:40px;color:#e5e7eb;">
    <div style="font-size:28px;font-weight:800;color:#BEF264;letter-spacing:.08em;">VETT</div>
    <div style="font-size:11px;color:#9ca3af;letter-spacing:.12em;margin-top:2px;">AI-POWERED MARKET RESEARCH</div>
    <div style="height:28px;"></div>
    <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Your sign-in link</h1>
    <p style="color:#9ca3af;line-height:1.7;">
      Click the button below to sign in to VETT as
      <strong style="color:#fff;">{{ .Email }}</strong>.
      The link expires in 1 hour.
    </p>
    <div style="margin:24px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BEF264;color:#0B0C15;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Sign in to VETT →</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      If the button doesn't work, paste this link into your browser:<br>
      <span style="color:#9ca3af;word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-top:20px;">
      Didn't request this link? You can safely ignore this email — your account stays secure.
    </p>
    <div style="height:40px;"></div>
    <div style="border-top:1px solid #1f2937;padding-top:20px;font-size:11px;color:#6b7280;line-height:1.7;">
      VETT · vettit.ai · Dubai, UAE
    </div>
  </div>
</div>
</body></html>
```

---

## 3. Reset password

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your VETT password</title></head>
<body style="margin:0;padding:0;background:#05060b;font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#0B0C15;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(90deg,#BEF264 0%,#84cc16 100%);height:6px;"></div>
  <div style="padding:40px;color:#e5e7eb;">
    <div style="font-size:28px;font-weight:800;color:#BEF264;letter-spacing:.08em;">VETT</div>
    <div style="font-size:11px;color:#9ca3af;letter-spacing:.12em;margin-top:2px;">AI-POWERED MARKET RESEARCH</div>
    <div style="height:28px;"></div>
    <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">Reset your password</h1>
    <p style="color:#9ca3af;line-height:1.7;">
      Someone asked to reset the password on
      <strong style="color:#fff;">{{ .Email }}</strong>.
      If that was you, click below to set a new one. The link expires in 1 hour.
    </p>
    <div style="margin:24px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BEF264;color:#0B0C15;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Reset password →</a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      If the button doesn't work, paste this link into your browser:<br>
      <span style="color:#9ca3af;word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-top:20px;">
      Didn't request this? Ignore this email — your password stays as it is.
    </p>
    <div style="height:40px;"></div>
    <div style="border-top:1px solid #1f2937;padding-top:20px;font-size:11px;color:#6b7280;line-height:1.7;">
      VETT · vettit.ai · Dubai, UAE
    </div>
  </div>
</div>
</body></html>
```

---

## 4. Invite user

```html
<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You've been invited to VETT</title></head>
<body style="margin:0;padding:0;background:#05060b;font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#0B0C15;border-radius:16px;overflow:hidden;border:1px solid #1f2937;">
  <div style="background:linear-gradient(90deg,#BEF264 0%,#84cc16 100%);height:6px;"></div>
  <div style="padding:40px;color:#e5e7eb;">
    <div style="font-size:28px;font-weight:800;color:#BEF264;letter-spacing:.08em;">VETT</div>
    <div style="font-size:11px;color:#9ca3af;letter-spacing:.12em;margin-top:2px;">AI-POWERED MARKET RESEARCH</div>
    <div style="height:28px;"></div>
    <h1 style="color:#fff;font-size:22px;margin:0 0 12px;">You've been invited to VETT</h1>
    <p style="color:#9ca3af;line-height:1.7;">
      Welcome — you've been invited to join VETT, the AI market-research
      platform that turns research questions into qualified-respondent
      reports in minutes. Click below to set up your account.
    </p>
    <div style="margin:24px 0;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#BEF264;color:#0B0C15;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Accept invite →</a>
    </div>
    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:18px;margin:18px 0;">
      <div style="color:#BEF264;font-weight:700;margin-bottom:6px;font-size:13px;">What VETT does</div>
      <ul style="color:#9ca3af;line-height:1.7;padding-left:18px;margin:6px 0 0;">
        <li>Generates synthetic respondents that match your audience</li>
        <li>Runs your survey + analyses results — every mission, in minutes</li>
        <li>Pay per mission · refund the gap if we fall short</li>
      </ul>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;">
      If the button doesn't work, paste this link into your browser:<br>
      <span style="color:#9ca3af;word-break:break-all;">{{ .ConfirmationURL }}</span>
    </p>
    <div style="height:40px;"></div>
    <div style="border-top:1px solid #1f2937;padding-top:20px;font-size:11px;color:#6b7280;line-height:1.7;">
      VETT · vettit.ai · Dubai, UAE
    </div>
  </div>
</div>
</body></html>
```

---

## Subject lines (set in Supabase Dashboard alongside the body)

| Template | Subject |
|---|---|
| Confirm signup | Confirm your VETT account |
| Magic link | Your VETT sign-in link |
| Reset password | Reset your VETT password |
| Invite user | You've been invited to VETT |

## Smoke test (after Jamil pastes)

1. Sign up with a fresh email at `vettit.ai/signin?tab=signup` → "Confirm your VETT account" lands.
2. Forgot password → "Reset your VETT password" lands.
3. Magic link via `supabase.auth.signInWithOtp({email})` (manual test) → "Your VETT sign-in link" lands.
4. Invite user via Supabase Dashboard → Auth → Users → Invite → "You've been invited to VETT" lands.

All four should render the lime-accent shell + dark card consistently with
the transactional emails (welcome / mission_complete / partial_delivery)
already in production.
