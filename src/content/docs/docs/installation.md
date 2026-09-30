---
title: Installation
description: Create a new app from Tachi Kit and get it running locally.
---

## Requirements

- PHP **8.4** or newer, and [Composer](https://getcomposer.org)
- Node.js **22** or newer, and npm
- SQLite (the default) or MySQL

## Creating an app

Use the Laravel installer:

```bash
laravel new my-app --using=monciego/tachi-kit
```

Or Composer directly:

```bash
composer create-project monciego/tachi-kit my-app
```

Either way, Composer runs the kit's install scripts for you:

1. Copies `.env.example` to `.env`.
2. Generates `APP_KEY`.
3. Creates `database/database.sqlite`.
4. Runs the migrations.
5. Seeds the roles and permissions (`RolePermissionSeeder`). No demo users are created.

Then install the frontend, link storage (needed for avatars) and start the app:

```bash
cd my-app
npm install
php artisan storage:link
composer dev
```

`composer dev` runs `php artisan dev`, which starts the PHP server and Vite together. The app URL is `APP_URL` in `.env` (`http://localhost:8000` by default).

:::note
The kit uses **npm**. It ships a `package-lock.json` only, so stick with npm to keep installs reproducible.
:::

## Working from a clone

If you cloned the repository instead of using `create-project`, one command does everything:

```bash
composer setup
```

It runs `composer install`, creates `.env`, generates the key, migrates, links storage, and runs `npm install` and `npm run build`.

## Demo data

To explore the kit with realistic data, seed the demo accounts:

```bash
php artisan db:seed
```

This creates the accounts below, plus 50 members spread over the past year so the dashboard chart has something to show. Every account's password is `password`.

| Email | Role |
| --- | --- |
| `superadmin@tachikit.com` | superadmin |
| `superadmin2@tachikit.com` | superadmin |
| `administrator@tachikit.com` | admin |
| `admin@tachikit.com` | admin |

:::caution
Demo accounts are **never** seeded in production. `DatabaseSeeder` skips `DemoUserSeeder` when `APP_ENV=production`. To create your first real account, use [`php artisan tachi:superadmin`](/docs/digging-deeper/artisan-commands/#tachisuperadmin).
:::

## Using MySQL

SQLite works out of the box. To use MySQL, create a database, update `.env`, then migrate and seed the roles:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tachikit
DB_USERNAME=root
DB_PASSWORD=
```

```bash
php artisan migrate
php artisan db:seed --class=RolePermissionSeeder
```

## Next steps

- Review the [configuration options](/docs/configuration/), especially whether anyone can sign up.
- Read the [development workflow](/docs/development/) for the everyday commands and quality gates.
