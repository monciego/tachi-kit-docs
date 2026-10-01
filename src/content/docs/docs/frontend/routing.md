---
title: Typed Routes
description: Calling Laravel routes and controller actions from React with Wayfinder.
---

Tachi Kit never hard-codes URLs in React. [Laravel Wayfinder](https://github.com/laravel/wayfinder) generates typed TypeScript functions for every route and controller action, so a renamed route or a missing parameter is a compile error instead of a broken link.

## Two ways to import

**Named routes**, from `@/routes`:

```tsx
import { dashboard, login } from '@/routes';
import users from '@/routes/users';

<Link href={dashboard()}>Dashboard</Link>
<Link href={users.edit(user.id)}>Edit</Link>
router.post(users.bulkDelete().url, { ids });
```

**Controller actions**, from `@/actions`:

```tsx
import UserController from '@/actions/App/Http/Controllers/UserController';

router.patch(UserController.updateStatus.url(user.id), { is_active: false });
```

Each helper returns `{ url, method }`, which Inertia's `<Link>` and `router` accept directly. Use `.url` (or `.url(...)`) when you only need the string.

## Form variants

`.form()` returns the `action` and `method` props for Inertia's `<Form>` component, including method spoofing for `PUT`, `PATCH` and `DELETE`:

```tsx
<Form {...ProfileController.update.form()}>
    {({ errors, processing }) => (/* … */)}
</Form>
```

The kit's auth and settings pages rely on these form variants.

## Regenerating

The helpers are generated into `resources/js/routes/` and `resources/js/actions/`. Both are gitignored, so they're rebuilt on every machine:

- **Automatically** by the Wayfinder Vite plugin (`wayfinder({ formVariants: true })` in `vite.config.ts`) whenever Vite starts or builds, and whenever a file in `routes/` or `app/Http/` changes.
- **By hand**:

```bash
php artisan wayfinder:generate --with-form
```

:::caution
Always pass `--with-form` when running the command yourself. Without it, the generated files lose their `.form()` variants and `tsc` fails on the auth and settings pages.
:::

## Customizing

Nothing to configure for normal use: add a route or controller method, and its helper appears. If you rename a route or remove an action, run `npm run types:check` to find every call site that needs updating.
