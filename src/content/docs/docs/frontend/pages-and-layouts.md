---
title: Pages & Layouts
description: How Inertia pages are organized, how layouts are chosen, and how to add a new page.
---

The frontend is React 19 with [Inertia 3](https://inertiajs.com). Controllers return `Inertia::render('users/index', [...])`, and Inertia renders `resources/js/pages/users/index.tsx` with those props. There's no client-side router and no API layer to maintain.

## Page conventions

- One folder per feature under `resources/js/pages/`: `users/`, `roles/`, `activity/`, `settings/`, `auth/`.
- List pages keep their table columns in a sibling `columns.tsx`.
- Each page is a default-exported component whose props match what the controller sends. Declare them with an interface:

```tsx
interface IndexProps {
    activities: Paginator<ActivityEntry>;
    eventOptions: ActivityEventOption[];
}

export default function Index({ activities, eventOptions }: IndexProps) {
    // …
}
```

## Layouts

Layouts are chosen centrally in `resources/js/app.tsx` by page name, so pages don't wrap themselves:

```tsx
layout: (name) => {
    switch (true) {
        case name === 'welcome':
            return null;
        case name.startsWith('auth/'):
            return AuthLayout;
        case name.startsWith('settings/'):
            return [AppLayout, SettingsLayout];
        default:
            return AppLayout;
    }
},
```

| Pages | Layout |
| --- | --- |
| `welcome` | None |
| `auth/*` | `AuthLayout` (a centered card) |
| `settings/*` | `AppLayout` with `SettingsLayout` (tabs) nested inside |
| Everything else | `AppLayout` (sidebar, header with breadcrumbs, and global search) |

### Passing props to the layout

Pages set layout props with a static `layout` property. App pages provide **breadcrumbs**:

```tsx
Index.layout = {
    breadcrumbs: [{ title: 'Activity log', href: activity.index() }],
};
```

Auth pages provide a **title and description** for the card:

```tsx
Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
```

## Customizing

### Switching to a top header instead of a sidebar

`resources/js/layouts/app-layout.tsx` uses `app/app-sidebar-layout.tsx`. The kit also ships `app/app-header-layout.tsx`, which puts navigation in a top bar. Change the import to switch.

### Changing the auth card style

`resources/js/layouts/auth-layout.tsx` uses `auth/auth-card-layout.tsx`. `auth-simple-layout.tsx` and `auth-split-layout.tsx` (with a side panel) are also included. Change the import to switch.

### Adding a page

1. Add a route and controller action:

   ```php
   Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
   ```

   ```php
   public function index(): Response
   {
       return Inertia::render('reports/index', [
           'reports' => Report::query()->latest()->get(),
       ]);
   }
   ```

2. Create `resources/js/pages/reports/index.tsx`. It gets `AppLayout` automatically.
3. Link to it with the typed route helper (`import reports from '@/routes/reports'`) and add it to the [navigation](/docs/frontend/navigation/).

For a paginated, searchable list, follow the [Data Tables](/docs/frontend/data-tables/) walkthrough instead.

### A page without the app chrome

Add a case to the `layout` switch in `app.tsx`, the same way `welcome` returns `null`.
