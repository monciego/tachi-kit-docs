---
title: Configuration
description: Environment variables and kit-level settings in config/tachi.php.
---

Tachi Kit uses Laravel's normal configuration: environment variables in `.env`, read through files in `config/`. On top of the standard Laravel settings, the kit adds a few of its own.

## Environment variables

| Variable | `.env.example` | Default when unset | What it does |
| --- | --- | --- | --- |
| `APP_NAME` | `"Tachi Kit"` | `Laravel` | Shown in the sidebar, page titles, emails and the landing page. |
| `ALLOWS_PUBLIC_REGISTRATION` | `true` | `false` | Whether anyone can sign up. See [Registration](/docs/authentication/registration/). |
| `AVATAR_DISK` | `public` | `public` | Filesystem disk where avatars are stored. See [Profile & Settings](/docs/features/profile-settings/#avatars). |
| `DB_CONNECTION` | `sqlite` | `sqlite` | Database driver. MySQL is supported too. |
| `QUEUE_CONNECTION` | `database` | `database` | Standard Laravel queue setting. |
| `MAIL_MAILER` | `log` | `log` | Emails (verification, password reset) are written to the log until you configure a mailer. |

:::caution
`.env.example` turns public registration **on** for convenience in local development, but the config default is **off**. Decide explicitly in production by setting `ALLOWS_PUBLIC_REGISTRATION`.
:::

## `config/tachi.php`

Kit-level business settings live in `config/tachi.php`, separate from package configs like `fortify.php`:

```php
return [

    'registration' => [
        'public' => env('ALLOWS_PUBLIC_REGISTRATION', false),
    ],

    'avatars' => [
        'disk' => env('AVATAR_DISK', 'public'),
        'max_kilobytes' => 2048,
    ],

];
```

| Key | Used by |
| --- | --- |
| `tachi.registration.public` | `FortifyServiceProvider` (blocks `/register` with a 404) and the shared `canRegister` Inertia prop (hides sign-up links). |
| `tachi.avatars.disk` | `User::avatar` (URL generation) and `Settings\AvatarController` (storage). |
| `tachi.avatars.max_kilobytes` | `AvatarUpdateRequest` validation. The upload form's hint says "up to 2 MB", so update `avatar-upload.tsx` if you change this. |

## Package configuration

These package config files are the ones you're most likely to touch:

| File | What to change there |
| --- | --- |
| `config/fortify.php` | Which auth features are on (2FA, passkeys, email verification…). See [Authentication](/docs/authentication/overview/). |
| `config/permission.php` | Spatie permission settings. `'role' => App\Models\Role::class` must stay pointed at the kit's `Role` model. |
| `config/inertia.php` | Inertia settings such as SSR. |

The activity log uses the defaults of `spatie/laravel-activitylog` without a published config file. To change retention or disable logging, see [Activity Log → Customizing](/docs/features/activity-log/#customizing).

## Customizing

### Adding your own kit-level setting

Put app-wide toggles in `config/tachi.php` so they're easy to find and override per environment:

```php
// config/tachi.php
'invitations' => [
    'expire_after_days' => env('INVITATION_EXPIRY_DAYS', 7),
],
```

Read it with `config('tachi.invitations.expire_after_days')`. If the frontend needs it, share it from `HandleInertiaRequests::share()` like `canRegister`:

```php
// app/Http/Middleware/HandleInertiaRequests.php
return [
    ...parent::share($request),
    // ...
    'canRegister' => config('tachi.registration.public'),
    'invitationExpiryDays' => config('tachi.invitations.expire_after_days'),
];
```

Then add the key to the `sharedPageProps` type in `resources/js/types/global.d.ts`, so `usePage().props` is typed.
