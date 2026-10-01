---
title: Superadmin Visibility
description: How superadmin accounts stay hidden from everyone else, and how to keep that true in your own features.
---

Superadmins are the owners of the app. Tachi Kit keeps them **invisible to everyone who isn't a superadmin**: admins can't see, count, filter, edit or delete them. This prevents an admin from locking out, impersonating or even discovering the owners.

## Where it applies

| Place | How superadmins are hidden |
| --- | --- |
| Users list | Rows are excluded (`visibleTo()`). |
| Role filter and role pickers | The `superadmin` option is removed (`UserController::availableRoleNames()`). |
| Dashboard stats, chart and recent users | Counts and lists use `visibleTo()`. |
| Activity log | Entries whose actor **or** subject is a superadmin are excluded. |
| Editing | `UserPolicy::update` returns 403 if a non-superadmin targets a superadmin. |

Superadmins see everything, including other superadmins.

## The `visibleTo()` scope

`App\Models\User` has a local scope that applies the rule:

```php
#[Scope]
protected function visibleTo(Builder $query, User $viewer): void
{
    if ($viewer->isSuperadmin()) {
        return;
    }

    $query->whereDoesntHave('roles', fn (Builder $role) => $role->where('name', RoleName::Superadmin->value));
}
```

Use it for **every** query that lists or counts users for someone to see:

```php
$users = User::query()
    ->visibleTo($request->user())
    ->latest()
    ->paginate();
```

## Customizing

### Applying the rule to your own features

When you build something that shows users, such as a "Team members" widget, an export or an assignee picker, start the query with `visibleTo()`. For data that *references* users, like an audit table, filter out rows that point at superadmins the way `ActivityController` does:

```php
$superadminIds = User::withTrashed()->role(RoleName::Superadmin->value)->pluck('id');

$query->where(function (Builder $sub) use ($superadminIds) {
    $sub->whereNull('user_id')->orWhereNotIn('user_id', $superadminIds);
});
```

:::caution
Mind the `NULL` case. A plain `whereNotIn('user_id', …)` also drops rows where `user_id` is `NULL`, because SQL's `NOT IN` never matches `NULL`. Add the `whereNull` branch as shown.
:::

### Turning the rule off

If your app doesn't need hidden owners, make the scope a no-op, or remove its calls, and drop the superadmin exclusions in `UserController::availableRoleNames()` and `ActivityController::withoutSuperadminActivity()`. The `UsersTest`, `DashboardTest` and `ActivityLogTest` tests that assert hiding will then fail and can be removed.
