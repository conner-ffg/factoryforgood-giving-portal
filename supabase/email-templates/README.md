# Branded auth emails

HTML templates for every email Supabase sends on FFG's behalf, styled to the
brand (cream ground, ink serif wordmark, rounded dark button). All CSS is
inline and table-based so they render in Gmail/Outlook/Apple Mail.

## Install (2 minutes, Supabase dashboard)
Authentication → Email Templates, then for each:

| Template in Supabase | File | Subject line to set |
|---|---|---|
| Magic Link | `magic-link.html` | Your Factory for Good sign-in link |
| Confirm signup | `confirm-signup.html` | Welcome to Factory for Good — confirm your email |
| Reset password | `reset-password.html` | Reset your Factory for Good password |
| Reauthentication | `reauthentication.html` | Your Factory for Good confirmation code |

Paste the file's full contents into the template body (Source view), set the
subject, save. `{{ .ConfirmationURL }}` is filled in by Supabase.

Also check Authentication → URL Configuration: **Site URL** must be the live
portal address (this is where the email link lands).

## Branded sender address (recommended)
By default these arrive from Supabase's shared sender, which caps at a few
emails/hour and looks generic. To send from `hello@factoryforgood.com`:
1. Create a free account at an email provider (Resend is simple; SendGrid,
   Postmark, or SES also work) and verify the factoryforgood.com domain
   (they'll give you a few DNS records to add — SPF/DKIM).
2. Supabase → Project Settings → Authentication → SMTP Settings: enter the
   provider's SMTP host/credentials and your from-address + sender name
   ("Factory for Good").
That's it — same emails, your name and domain, much better deliverability.
