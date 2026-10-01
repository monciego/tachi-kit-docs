---
title: Authentication
description: How sign-in works in Tachi Kit, and where to customize it.
---

Tachi Kit's authentication is [Laravel Fortify](https://laravel.com/docs/fortify), the headless auth backend used by the official Laravel starter kits. Fortify registers the routes and controllers; the kit provides the React pages and a few rules of its own.

## Features

These features are enabled in `config/fortify.php`:

```php
'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
    Features::passkeys([
        'confirmPassword' => true,
    ]),
],
```

| Feature | Page | Notes |
| --- | --- | --- |
| Login | `pages/auth/login.tsx` | Email and password, or a passkey. Inactive accounts are rejected. |
| Registration | `pages/auth/register.tsx` | Only when public registration is on. See [Registration](/docs/authentication/registration/). |
| Password reset | `pages/auth/forgot-password.tsx`, `reset-password.tsx` | Emails a reset link. |
| Email verification | `pages/auth/verify-email.tsx` | Available, but not enforced by default. See below. |
| Two-factor authentication | `pages/auth/two-factor-challenge.tsx` | TOTP codes and recovery codes, managed on the Security settings page. |
| Password confirmation | `pages/auth/confirm-password.tsx` | Asked before sensitive pages such as Security settings. |
| Passkeys | Security settings | WebAuthn passkeys through `laravel/passkeys`. |

## Where things are wired

`app/Providers/FortifyServiceProvider.php` connects Fortify to the kit:

- **`configureViews()`** maps each Fortify screen to an Inertia page, e.g. `Fortify::loginView(...)` renders `auth/login`.
- **`configureActions()`**:
  - `Fortify::createUsersUsing()` uses `CreateNewUser` and returns 404 when public registration is off.
  - `Fortify::resetUserPasswordsUsing()` uses `ResetUserPassword`.
  - `Fortify::authenticateUsing()` checks the password and **rejects inactive accounts** with the message "Your account is inactive. Please contact an administrator."
  - `Passkeys::authorizeLoginUsing()` blocks inactive accounts from signing in with a passkey.
- **`configureRateLimiting()`** limits login to 5 attempts per minute per email and IP, the two-factor challenge to 5 per minute, and passkey attempts to 10 per minute.

Every sign-in, sign-out and failed sign-in is written to the [activity log](/docs/features/activity-log/) by `app/Listeners/LogAuthenticationActivity.php`.

## Password rules

`AppServiceProvider::configureDefaults()` sets `Password::defaults()`. In production, passwords need at least 12 characters, mixed case, letters, numbers and symbols, and must not appear in known data breaches. In other environments, Laravel's default minimum length applies, which keeps local testing easy. Every password field in the kit (registration, reset, change password, admin-created users) uses these rules.

## Customizing

### Requiring email verification

Verification is enabled in Fortify, and the app's routes use the `verified` middleware, but the `User` model doesn't implement `MustVerifyEmail`, so every user counts as verified. To require it, implement the contract:

```php
// app/Models/User.php
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
```

Unverified users are then redirected to `auth/verify-email` until they click the link. Configure a real mailer (`MAIL_MAILER`) first.

### Turning a feature off

Remove it from `features` in `config/fortify.php`. For example, delete `Features::passkeys([...])` to remove passkeys. Then regenerate the route helpers:

```bash
php artisan wayfinder:generate --with-form
```

Remove any UI that referenced the removed routes (e.g. the passkey section on the Security page) and run `npm run types:check` to find leftovers.

:::caution
Don't remove `Features::registration()` just to close sign-ups. Use `ALLOWS_PUBLIC_REGISTRATION=false` instead. The kit keeps the feature enabled so routes and generated helpers stay stable, and gates it itself.
:::

### Changing login rules

Edit the `Fortify::authenticateUsing()` closure. For example, to let people sign in with a username instead of an email, change `'username'` in `config/fortify.php` and the field in `pages/auth/login.tsx`. The closure and the failed-login listener both use `Fortify::username()`, so they follow automatically.

### Changing the pages

The auth pages are ordinary Inertia pages in `resources/js/pages/auth/` using the layouts in `resources/js/layouts/auth/`. Edit them like any other React page. To pass extra props to one of them, add the prop in the matching `Fortify::*View()` closure.
