---
title: Dashboard
description: The analytics dashboard, deferred props, and adding your own stat cards and charts.
---

The dashboard (`/dashboard`) is the landing screen after sign-in. For users who can list users, it shows:

- **Four stat cards**: total users, active users (with share of total), inactive users, and new users this month compared with last month.
- **New users chart**: sign-ups per month over the last 12 months, with a Chart/Table toggle.
- **Recent users**: the five newest accounts, with a "View all" link to the Users page.

Everyone else sees a simple "You're all set" card.

| Piece | File |
| --- | --- |
| Controller | `app/Http/Controllers/DashboardController.php` |
| Page | `resources/js/pages/dashboard.tsx` |
| Stat card | `resources/js/components/stat-card.tsx` |
| Chart | `resources/js/components/dashboard/signups-chart.tsx` |
| Recent users | `resources/js/components/dashboard/recent-users-table.tsx` |
| Types | `resources/js/types/dashboard.ts` |

## How the data loads

The controller checks access first, then returns the analytics as **[deferred props](https://inertiajs.com/deferred-props)**:

```php
public function __invoke(Request $request): Response
{
    $viewer = $request->user();

    if ($viewer->cannot('viewAny', User::class)) {
        return Inertia::render('dashboard');
    }

    return Inertia::render('dashboard', [
        'stats' => Inertia::defer(fn (): array => $this->stats($viewer)),
        'signups' => Inertia::defer(fn (): array => $this->signups($viewer)),
        'recentUsers' => Inertia::defer(fn (): array => $this->recentUsers($viewer)),
    ]);
}
```

The page renders at once with skeletons (`StatCardSkeleton`, `SignupsChartSkeleton`, `RecentUsersTableSkeleton`). Inertia then fetches the three props in one follow-up request and swaps the skeletons for real content. Slow queries never delay the first paint.

All three queries go through `User::visibleTo()`, so admins' numbers never include superadmins.

### Monthly grouping and databases

`signups()` groups users by month with a database-specific expression, because SQLite (tests), MySQL and PostgreSQL format dates differently:

```php
$month = match (DB::connection()->getDriverName()) {
    'sqlite' => "strftime('%Y-%m', created_at)",
    'pgsql' => "to_char(created_at, 'YYYY-MM')",
    'sqlsrv' => "format(created_at, 'yyyy-MM')",
    default => "date_format(created_at, '%Y-%m')",
};
```

Months with no sign-ups are filled with `0`, so the chart always shows 12 bars. Change `SIGNUP_MONTHS` or `RECENT_USERS_LIMIT` at the top of the controller to adjust the window or list size.

## The chart

`SignupsChart` uses the shadcn [chart component](https://ui.shadcn.com/docs/components/chart) (`components/ui/chart.tsx`), which wraps [Recharts](https://recharts.org):

- The bar color comes from the `--chart-1` theme token through a `ChartConfig`. Retheme it in `resources/css/app.css`.
- Hovering a bar shows a tooltip with the full month and count.
- The **Table** toggle shows the same numbers as an accessible table. It's also the fallback when the bar color is low-contrast on the dark theme.

## Customizing

### Adding a stat card

1. Add the value in `DashboardController::stats()` and its `@return` shape:

   ```php
   'admins' => $users()->role(RoleName::Admin->value)->count(),
   ```

2. Add it to `DashboardStats` in `resources/js/types/dashboard.ts`.
3. Render a card in `StatCards` (in `pages/dashboard.tsx`):

   ```tsx
   <StatCard
       title="Admins"
       value={stats.admins}
       icon={ShieldCheck}
       description="Can manage users"
   />
   ```

`StatCard` takes `title`, a numeric `value` (formatted for the user's locale), a Lucide `icon`, and an optional `description` (text or JSX). Change the grid's `xl:grid-cols-4` if you add a fifth card.

### Adding a new section

Add another deferred prop and render a skeleton until it arrives:

```php
'topRoles' => Inertia::defer(fn (): array => $this->topRoles($viewer)),
```

```tsx
{topRoles ? <TopRoles roles={topRoles} /> : <TopRolesSkeleton />}
```

Deferred props in the same group load in one request. To load a slow section separately, pass a group name: `Inertia::defer(fn () => ..., 'reports')`.

### Adding a chart

Build it the same way as `SignupsChart`: define a `ChartConfig` that maps each series to a `--chart-N` token, wrap Recharts components in `<ChartContainer>`, and use `<ChartTooltip content={<ChartTooltipContent />} />` for hover details. Use one hue per series, in token order, and add a legend once there are two or more series.

### Changing who sees analytics

Access is decided by `$viewer->cannot('viewAny', User::class)` in the controller and `can(PERMISSIONS.USERS_VIEW)` in the page. To show analytics based on a dedicated permission, add something like `dashboard.view` to the `Permission` enum ([how](/docs/authorization/permissions/#adding-a-permission)) and check it in both places.

### Making the dashboard your own

The analytics are an example of the patterns (deferred props, stat cards, charts, tables) rather than something your app must keep. Replace `DashboardController` and `pages/dashboard.tsx` with your product's own overview, and update `DashboardTest`.
