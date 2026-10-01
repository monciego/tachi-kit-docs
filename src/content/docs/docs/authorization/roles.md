---
title: Roles
description: The built-in system roles, custom roles, and the special rules for superadmins.
---

Roles are [spatie/laravel-permission](https://spatie.be/docs/laravel-permission) roles, using the kit's own model, `App\Models\Role`, which extends Spatie's. A role is a named bundle of [permissions](/docs/authorization/permissions/), and a user can hold several roles.

## System roles

Three roles are built in, defined by `App\Enums\RoleName`:

```php
enum RoleName: string
{
    case Superadmin = 'superadmin';

    case Admin = 'admin';

    case User = 'user';
}
```

| Role | Permissions | Notes |
| --- | --- | --- |
| `superadmin` | Every permission, and more (see below) | Hidden from non-superadmins, can't be deleted or deactivated. |
| `admin` | `users.view`, `users.create`, `users.edit`, `users.delete`, `users.status` | Manages users. No role management and no activity log by default. |
| `user` | None | Assigned to everyone who signs up. |

Permissions are granted in `database/seeders/RolePermissionSeeder.php`.

System roles are identified by name. `Role::isSystemRole()` returns `true` for any name in `RoleName`. System roles:

- can't be deleted, by anyone (`RolePolicy::delete`),
- can't be edited by non-superadmins (`RolePolicy::update`),
- are always listed first, in enum order (`Role::systemRolesFirst()` scope),
- are marked with a "System" badge on the Roles page.

:::tip
Use the enum instead of strings: `$user->hasRole(RoleName::Admin)`, or `$user->isSuperadmin()` for the common case. On the frontend, use `ROLES.ADMIN` from `@/constants/roles`, which is generated from the same enum.
:::

## The superadmin role

Superadmins are the owners of the app. The kit gives them extra rules on top of "can do everything":

| Rule | Enforced by |
| --- | --- |
| Pass every authorization check | `Gate::before` in `AppServiceProvider` (with [exceptions](/docs/authorization/policies/#the-superadmin-bypass)) |
| Invisible to non-superadmins in lists, counts, filters and the activity log | `User::visibleTo()` scope. See [Superadmin Visibility](/docs/authorization/superadmin-visibility/). |
| Can't be deleted, individually or in bulk | `UserPolicy::delete`, `UserController::bulkDestroy` |
| Can't be deactivated | `UserPolicy::updateStatus` |
| Read-only to non-superadmins | `UserPolicy::update`, and the edit page disables every input |
| Only superadmins can grant `superadmin` | `StoreUserRequest` / `UpdateUserRequest` validation |
| A superadmin can't remove their own `superadmin` role | `UserPolicy::update` |
| Can't be combined with other roles | The role picker on the user create and edit pages |
| The `superadmin` role's permissions can't be edited | The role edit page shows it read-only |

Create the first superadmin with `php artisan tachi:superadmin`. See [Artisan Commands](/docs/digging-deeper/artisan-commands/).

## Custom roles

Anyone with `roles.create` can add roles from the **Roles** page (`/roles`) and choose their permissions. Custom roles can be renamed, have their permissions changed (`roles.edit`), and be deleted (`roles.delete`) once no users hold them. See [Role Management](/docs/features/role-management/).

Custom roles are data, not code: they live in the database and aren't in `RoleName`.

## Customizing

### Changing what admins can do

Edit the `$admin->givePermissionTo([...])` list in `RolePermissionSeeder`, then re-run it:

```php
$admin = Role::query()->firstOrCreate(['name' => RoleName::Admin->value]);
$admin->givePermissionTo([
    PermissionEnum::UsersView->value,
    PermissionEnum::UsersCreate->value,
    PermissionEnum::UsersEdit->value,
    PermissionEnum::UsersDelete->value,
    PermissionEnum::UsersStatus->value,
    PermissionEnum::ActivityView->value, // now admins can read the activity log too
]);
```

```bash
php artisan db:seed --class=RolePermissionSeeder
```

The seeder only **adds** permissions. To take one away from an existing database, remove it on the Roles page (as a superadmin) or with `$admin->revokePermissionTo(...)`.

### Adding a system role

When a role must exist in every install and must never be deleted, make it a system role:

1. Add a case to `RoleName`, e.g. `case Manager = 'manager';`. Case order controls list order.
2. Create it and grant its permissions in `RolePermissionSeeder`:

   ```php
   $manager = Role::query()->firstOrCreate(['name' => RoleName::Manager->value]);
   $manager->givePermissionTo([PermissionEnum::UsersView->value]);
   ```

3. Regenerate the frontend constants: `php artisan tachi:types`.
4. Add a badge style for it in `resources/js/utils/role-color.ts`. `FIXED_ROLE_STYLES` must cover every system role, and `tsc` fails until it does.

For roles that admins should be able to manage themselves, use a custom role instead.
