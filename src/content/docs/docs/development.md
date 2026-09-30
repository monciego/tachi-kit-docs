---
title: Development Workflow
description: Everyday commands, quality gates, formatting and code generators.
---

## Everyday commands

| Command | What it does |
| --- | --- |
| `composer dev` | Starts the app and Vite together (`php artisan dev`). |
| `npm run dev` | Starts Vite only. |
| `npm run build` | Builds production assets. |
| `php artisan test --compact` | Runs the Pest suite. |
| `php artisan test --compact tests/Feature/UsersTest.php` | Runs one file. |
| `php artisan test --compact --filter="deletes a user"` | Runs one test by name. |

## Quality gates

CI (`.github/workflows`) runs a single command, and you can run the same thing locally:

```bash
composer ci:check
```

It runs these, in order:

| Step | Command | Tool |
| --- | --- | --- |
| Frontend lint and formatting | `npm run check` | Vite+ (`vp check`: oxlint and the formatter) |
| TypeScript | `npm run types:check` | `tsc --noEmit` |
| PHP style | `composer lint:check` | Laravel Pint |
| Static analysis | `composer types:check` | PHPStan / Larastan, level 7 |
| Tests | `php artisan test` | Pest |

`composer test` runs the PHP half (Pint, PHPStan and the tests).

### Fixing issues automatically

```bash
npm run check:fix     # frontend lint and formatting
composer lint         # PHP style (Pint)
```

## Formatting conventions

The frontend formatter is configured in `vite.config.ts`: 4-space indentation, single quotes, semicolons, 80-column lines, and sorted Tailwind classes. A `.prettierrc.json` mirrors these settings so VS Code and Zed format the same way on save.

These are excluded from formatting and linting:
- `resources/js/components/ui/*`: shadcn components, kept as upstream ships them.
- Generated files (`access.generated.ts`, Wayfinder output).
- Laravel Boost files (`AGENTS.md`, `.agents/`, `.ai/`), which Boost regenerates.

:::tip
If your editor keeps switching quotes to double quotes, it's using its own Prettier defaults. Make sure it picks up the project's `.prettierrc.json`, or run `npm run check:fix` before committing.
:::

## Code generators

### Route helpers (Wayfinder)

```bash
php artisan wayfinder:generate --with-form
```

:::caution
Always pass `--with-form`. The kit's Vite config emits `.form()` variants that the auth and settings pages use. Regenerating without the flag drops them and breaks `tsc`.
:::

See [Typed Routes](/docs/frontend/routing/).

### Role and permission constants

```bash
php artisan tachi:types
```

Run this after changing `app/Enums/Permission.php` or `app/Enums/RoleName.php`. See [Permissions](/docs/authorization/permissions/).

## AI assistants

The kit ships with [Laravel Boost](https://github.com/laravel/boost) guidelines (`AGENTS.md`), project rules in `.ai/rules/`, and a `CLAUDE.md` that describes the architecture. AI coding tools that read these files follow the kit's conventions, such as using `checkPermissionTo()` and never editing generated files. Delete them if you don't use AI tools.
