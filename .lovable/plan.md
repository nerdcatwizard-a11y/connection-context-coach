# Instant sign-in on account creation

New accounts will be active immediately — no confirmation email, no second sign-in step.

## What changes

1. **Turn off email confirmation** in the backend auth settings (auto-confirm signups). Signup then returns a live session right away.
2. **Sign-up screen** (`src/routes/auth.tsx`):
   - After a successful `signUp`, verify the returned session and navigate straight to `/home` (the onboarding gate handles first-run).
   - Remove the "Thank You! Please check your email" screen and both "Resend confirmation" buttons, since no confirmation email exists anymore.
   - Keep the existing password rules, repeat-password field, and duplicate-email handling ("that email already has an account — sign in").
   - Safety net: if a session somehow isn't returned, fall back to signing in with the submitted credentials before redirecting.
3. Leave Google/Apple sign-in and the password-reset flow untouched.

## Note on password reset

This project has no verified sender domain, so any email the backend sends (including password resets) goes out from a default shared sender and may land in spam. Auto-confirm removes email from the signup path entirely, but if you want reliable reset emails later, that needs a domain you own configured for sending.
