---
title: Deployment
description: A production checklist for apps built on Tachi Kit.
---

A Tachi Kit app deploys like any Laravel application, whether on [Laravel Cloud](https://cloud.laravel.com), Forge, or your own server. This checklist covers the kit-specific steps.

## Environment

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.com

ALLOWS_PUBLIC_REGISTRATION=false   # decide explicitly
AVATAR_DISK=s3                     # or public, with storage:link

MAIL_MAILER=smtp                   # verification and password reset emails
```

With `APP_ENV=production`:

- passwords must meet the strict rules (12+ characters, mixed case, numbers, symbols, not breached),
- `DatabaseSeeder` skips demo accounts, and
- destructive database commands such as `migrate:fresh` are blocked (`DB::prohibitDestructiveCommands()` in `AppServiceProvider`).

## Deploy steps

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build

php artisan migrate --force
php artisan db:seed --force          # roles and permissions only
php artisan storage:link             # if AVATAR_DISK=public

php artisan optimize
```

**First deploy only:** create the owner account.

```bash
php artisan tachi:superadmin
```

After adding permissions in a later release, the `db:seed --force` step creates them. It's safe to run on every deploy.

## Scheduler

The activity log is pruned by a scheduled command (`activitylog:clean`, daily). Laravel's scheduler must run every minute:

```text
* * * * * cd /path-to-your-app && php artisan schedule:run >> /dev/null 2>&1
```

Laravel Cloud and Forge can set this up for you. Check with `php artisan schedule:list`.

## Queue

`QUEUE_CONNECTION=database` is the default. The kit doesn't queue anything itself, but emails and your own jobs may. Run a worker (`php artisan queue:work`) or switch to a managed queue if you queue work.

## Checklist

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` set
- [ ] `ALLOWS_PUBLIC_REGISTRATION` set deliberately
- [ ] A real mailer configured
- [ ] Avatar storage reachable (S3 bucket policy, or `storage:link`)
- [ ] `migrate --force` and `db:seed --force` run
- [ ] First superadmin created with `tachi:superadmin`
- [ ] Scheduler cron running
- [ ] Assets built with `npm run build`
