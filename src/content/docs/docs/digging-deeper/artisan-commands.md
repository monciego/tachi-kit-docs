---
title: Artisan Commands
description: The commands Tachi Kit adds, and the scheduled activity log cleanup.
---

## `tachi:superadmin`

Creates a verified superadmin account. Use it for your first account in production, where demo accounts are never seeded.

```bash
php artisan tachi:superadmin
```

It asks for a name, email address and password. Pass them as options to skip the prompts, e.g. in a provisioning script:

```bash
php artisan tachi:superadmin --name="Jane Owner" --email=jane@example.com --password="a-long-secret"
```

What it does:

1. Validates the input: email must be valid and unique, and the password must follow the app's password rules (strict in production).
2. Runs `RolePermissionSeeder`, so the `superadmin` role exists even on a fresh database.
3. Creates the user, marks the email as verified, and assigns `superadmin`.

It exits with a failure code and prints the validation errors if anything is invalid. Source: `app/Console/Commands/CreateSuperadmin.php`.

:::caution
Passing `--password` on the command line can leave it in your shell history. Prefer the interactive prompt on shared machines.
:::

## `tachi:types`

Regenerates `resources/js/constants/access.generated.ts` from `App\Enums\RoleName` and `App\Enums\Permission`: the `ROLES` and `PERMISSIONS` constants, permission labels and groups, and their TypeScript types.

```bash
php artisan tachi:types
```

| Option | Effect |
| --- | --- |
| `--check` | Doesn't write anything. Fails if the file is missing or out of date. |
| `--path=` | Writes to (or checks) another file, relative to the project root. |

Run it whenever you change either enum. The test suite runs the `--check` form (`GenerateAccessTypesTest`), so a stale file fails CI. Source: `app/Console/Commands/GenerateAccessTypes.php`.

## `activitylog:clean`

Provided by `spatie/laravel-activitylog`. Deletes activity log entries older than `clean_after_days` (365 by default), or older than `--days=` when given.

```bash
php artisan activitylog:clean --days=90
```

The kit schedules it daily in `routes/console.php`:

```php
Schedule::command('activitylog:clean')->daily();
```

Scheduled commands only run when the scheduler runs. See [Deployment](/docs/digging-deeper/deployment/#scheduler).

## Other commands you'll use

| Command | Purpose |
| --- | --- |
| `php artisan wayfinder:generate --with-form` | Regenerate typed route helpers. See [Typed Routes](/docs/frontend/routing/). |
| `php artisan db:seed --class=RolePermissionSeeder` | Create any missing permissions and roles. Safe to re-run. |
| `php artisan dev` (`composer dev`) | Start the development processes. |
| `php artisan schedule:list` | See scheduled commands and their next run. |

## Customizing

Add your own commands in `app/Console/Commands/`; Laravel discovers them automatically. The kit's commands use the `#[Signature]` and `#[Description]` attributes and Laravel Prompts, a good template to copy. Prefix kit-level commands with your app's name, as the kit does with `tachi:`.
