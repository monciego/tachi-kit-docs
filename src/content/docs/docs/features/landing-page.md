---
title: Landing Page & Branding
description: Customizing the public welcome page, the app name, logo and favicon.
---

The public home page (`/`) is `resources/js/pages/welcome.tsx`, registered in `routes/web.php`:

```php
Route::inertia('/', 'welcome')->name('home');
```

It's a plain Inertia page with **no app layout** (`app.tsx` returns `null` as the layout for `welcome`), so it can look completely different from the signed-in app.

## What's on it

- A header with the brand mark and app name, plus **Log in** / **Sign up** buttons, or **Dashboard** when signed in.
- A hero with the headline, a short description, calls to action, and a `composer setup` / `composer dev` snippet.
- A feature grid, driven by the `FEATURES` array at the top of the file.
- A "Built on…" strip, driven by the `STACK` array.
- A footer.

The buttons adapt automatically. **Sign up** only shows when `canRegister` is `true` (see [Registration](/docs/authentication/registration/)), and signed-in users see **Go to dashboard** instead.

## Customizing

### Changing the content

Edit the copy and the two arrays in `welcome.tsx`:

```tsx
const FEATURES: Feature[] = [
    {
        icon: KeyRound,
        title: 'Authentication',
        description: 'Login, registration, email verification…',
    },
    // …
];
```

Icons come from [Lucide](https://lucide.dev/icons). The page uses the app's theme tokens (`bg-background`, `text-muted-foreground`, `border`…), so it follows light and dark mode and any color changes you make in `app.css`.

:::tip
The snippet and feature list describe the **starter kit**. Once you've built your product, replace them with your own marketing copy.
:::

### Skipping the landing page

If your app has no public page, send visitors straight to sign-in (and signed-in users to the dashboard):

```php
// routes/web.php
Route::redirect('/', '/dashboard')->name('home');
```

Guests hitting `/dashboard` are redirected to the login page by the `auth` middleware. Keep the `home` route name: the auth layouts' logo links use it (`home()` from `@/routes`).

### App name

Set `APP_NAME` in `.env`. It's shared with every page as `name` and used in the sidebar, page titles (via `VITE_APP_NAME`), emails and the landing page header. Restart Vite after changing it, since `VITE_APP_NAME` is read at build time.

### Logo

The in-app logo is `resources/js/components/app-logo-icon.tsx`, an inline SVG that `app-logo.tsx` places next to the app name in the sidebar and header. It ships with the Laravel logo from the upstream starter kit. Replace the `<path>` with your own mark, keeping `{...props}` on the `<svg>` so size and color classes still apply.

The landing page header uses Lucide's `Sword` icon. Swap it for `<AppLogoIcon />` to use the same logo everywhere.

### Favicon

Replace `public/favicon.ico`, `public/favicon.svg` and `public/apple-touch-icon.png`. They're referenced in `resources/views/app.blade.php`.
