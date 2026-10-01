---
title: Permissions
description: Defining permissions in one enum, sharing them with React, and checking them everywhere.
---

A permission is a single ability such as `users.delete`. Roles bundle permissions, and users get permissions through their roles.

In Tachi Kit, **`app/Enums/Permission.php` is the single source of truth**. The database rows, the role editor, the TypeScript constants and the `auth.can` map all come from it.

## The built-in permissions

| Permission | Label | Group | Guards |
| --- | --- | --- | --- |
| `users.view` | View Users | Users | Users page, dashboard analytics |
| `users.create` | Create Users | Users | Create user |
| `users.edit` | Edit Users | Users | Edit user |
| `users.delete` | Delete Users | Users | Delete and bulk delete |
| `users.status` | Change User Status | Users | Activate and deactivate |
| `roles.view` | View Roles | Roles | Roles page |
| `roles.create` | Create Roles | Roles | Create role |
| `roles.edit` | Edit Roles | Roles | Edit role |
| `roles.delete` | Delete Roles | Roles | Delete role |
| `activity.view` | View Activity Log | Activity | Activity log page |

```php
enum Permission: string
{
    // Users
    case UsersView = 'users.view';
    // ...

    // Activity
    case ActivityView = 'activity.view';

    public function label(): string { /* 'View Activity Log', ... */ }

    public function group(): string { /* 'Users', 'Roles', 'Activity' */ }

    public static function values(): array { /* every value */ }
}
```

- `label()` is the text shown in the role editor.
- `group()` is taken from the prefix before the dot (`activity.view` → `Activity`). The role editor groups checkboxes by it.

## Adding a permission

Say you're adding a Posts feature and want a `posts.publish` permission.

### 1. Add it to the enum

```php
// app/Enums/Permission.php

// Posts
case PostsPublish = 'posts.publish';

public function label(): string
{
    return match ($this) {
        // ...
        self::PostsPublish => 'Publish Posts',
    };
}
```

### 2. Regenerate the TypeScript constants

```bash
php artisan tachi:types
```

This rewrites `resources/js/constants/access.generated.ts`, adding `PERMISSIONS.POSTS_PUBLISH`, its label, and a new `Posts` group.

:::caution
Never edit `access.generated.ts` by hand. A test (`GenerateAccessTypesTest`) fails whenever the file doesn't match the enums, so CI catches a forgotten `tachi:types`.
:::

### 3. Seed it

```bash
php artisan db:seed --class=RolePermissionSeeder
```

The seeder creates a database row for every enum case and gives **superadmin every permission** automatically. To give it to `admin` as well, add it to the admin list in the seeder. Any other role can get it from the Roles page.

### 4. Check it on the backend

In a [policy](/docs/authorization/policies/) (preferred):

```php
public function publish(User $user, Post $post): bool
{
    return $user->checkPermissionTo(Permission::PostsPublish->value);
}
```

```php
// in a controller
$this->authorize('publish', $post);
```

Or directly on a route, using Spatie's gate integration:

```php
Route::post('posts/{post}/publish', PublishPostController::class)
    ->middleware('can:posts.publish');
```

:::tip[Use `checkPermissionTo()`, not `hasPermissionTo()`]
Spatie's `hasPermissionTo()` **throws** `PermissionDoesNotExist` when a permission hasn't been seeded yet, for example right after you add an enum case but before seeding, which turns a page into a 500. `checkPermissionTo()` returns `false` instead. The whole kit uses `checkPermissionTo()`.
:::

### 5. Check it on the frontend

Every page receives `auth.can`, a map of **every** permission name to a boolean for the current user. It's built in `HandleInertiaRequests` from `Permission::values()`, so new permissions appear automatically. Read it with the `usePermissions()` hook:

```tsx
import { PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/use-permissions';

export function PublishButton() {
    const { can } = usePermissions();

    if (!can(PERMISSIONS.POSTS_PUBLISH)) {
        return null;
    }

    return <Button>Publish</Button>;
}
```

`usePermissions()` returns:

| Function | Returns `true` when |
| --- | --- |
| `can(permission)` | the user has the permission |
| `cannot(permission)` | the user doesn't have it |
| `canAny([...])` | the user has at least one |
| `canAll([...])` | the user has all of them |
| `hasRole(name)` | the user holds the role, e.g. `hasRole(ROLES.ADMIN)` |

Permission names are typed (`PermissionName`), so a typo is a TypeScript error.

To gate a sidebar link, set `permission` on its nav item. See [Navigation](/docs/frontend/navigation/).

:::caution
Hiding a button is a convenience, not security. Always enforce the same permission on the server with a policy, `authorize()` or `can:` middleware.
:::

## Customizing

### Renaming or removing a permission

1. Change or remove the enum case (and its `label()` arm).
2. Run `php artisan tachi:types` and fix the TypeScript errors it reveals.
3. The seeder doesn't delete rows. Clean up the old permission yourself in a migration:

```php
Permission::query()->where('name', 'posts.publish')->delete(); // Spatie\Permission\Models\Permission
app(PermissionRegistrar::class)->forgetCachedPermissions();
```

### Custom group names

Groups come from the prefix, so `reports.export` goes into a `Reports` group. To name a group differently, change `group()` in the enum to return your own label for those cases.
