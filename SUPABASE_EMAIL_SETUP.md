# Fix Email Confirmation in Supabase

## Steps to Configure Email Confirmation

### 1. Update Email Template in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/oywbpwlhruupdzbvwwjr/auth/templates
2. Click on "Confirm signup" template
3. Update the template to include the correct redirect URL:

**Default template has:**

```html
<a href="{{ .ConfirmationURL }}">Confirm your email</a>
```

**Make sure the Redirect URL in Authentication Settings is set to:**

```
http://localhost:3000/auth/confirm
```

### 2. Configure Authentication Settings

1. Go to Authentication → URL Configuration
2. Update these settings:

**Site URL:**

```
http://localhost:3000
```

**Redirect URLs (add these):**

```
http://localhost:3000/auth/confirm
http://localhost:3000/dashboard
```

### 3. For Development - Disable Email Confirmation (Optional)

If you want to skip email confirmation during development:

1. Go to Authentication → Providers → Email
2. Toggle OFF "Confirm email"
3. Users will be automatically confirmed upon signup

### 4. For Production

When deploying to production, update the URLs to your production domain:

- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/auth/confirm`

## How It Works

1. User registers at `/register`
2. Supabase sends confirmation email
3. User clicks link in email
4. Link goes to Supabase, then redirects to `/auth/confirm` with token
5. Our route handler at `/app/auth/confirm/route.ts` verifies the token
6. User is redirected to `/dashboard` after successful confirmation

## Troubleshooting

- **Email not arriving**: Check spam folder
- **"Invalid token" error**: Token may have expired (default 24 hours)
- **Redirect not working**: Ensure URL is in Redirect URLs whitelist
- **User not confirmed**: Check Authentication → Users in Supabase dashboard
