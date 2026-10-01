---
title: Seeding
description: Roles and permissions seeding, demo data, and how seeding behaves in production.
---

Tachi Kit has three seeders in `database/seeders/`:

| Seeder | Runs | Creates |
| --- | --- | --- |
| `DatabaseSeeder` | `php artisan db:seed` | Calls the two below |
| `RolePermissionSeeder` | Always | Every permission, plus the `superadmin`, `admin` and `user` roles with their permissions |
| `DemoUserSeeder` | Outside production only | Four demo staff accounts and 50 members |

```php
public function run(): void
{
    $this->call(RolePermissionSeeder::class);

    if (app()->isProduction()) {
        return;
    }

    $this->call(DemoUserSeeder::class);
}
```

## `RolePermissionSeeder`

- Creates one permission per `Permission` enum case.
- Creates the system roles. `superadmin` gets **every** permission (`PermissionEnum::values()`); `admin` gets the user-management permissions; `user` gets none.
- Is **idempotent**: it uses `firstOrCreate` everywhere, so running it again never duplicates or fails. Re-run it after adding a permission:

```bash
php artisan db:seed --class=RolePermissionSeeder
```

:::note
The seeder clears Spatie's permission cache (`forgetCachedPermissions()`) **after** creating permissions and **before** assigning them. This matters because `DatabaseSeeder` runs with `WithoutModelEvents`, which switches off Spatie's automatic cache refresh. Without the reset, a stale cache would make `givePermissionTo()` throw. Keep the order if you edit the seeder.
:::

It never **removes** permissions or revokes them from roles. Do removals in a migration or on the Roles page.

## `DemoUserSeeder`

Seeds only when the `users` table is empty, so it never touches real data:

| Email | Role |
| --- | --- |
| `superadmin@tachikit.com` | superadmin |
| `superadmin2@tachikit.com` | superadmin |
| `administrator@tachikit.com` | admin |
| `admin@tachikit.com` | admin |

Plus 50 `user`-role members with random names, created over the last 12 months (for the dashboard chart), about 10% of them inactive. Every password is `password`.

## Production

`php artisan db:seed --force` in production only runs `RolePermissionSeeder`. Create your first account with [`tachi:superadmin`](/docs/digging-deeper/artisan-commands/#tachisuperadmin).

## Customizing

### Changing the demo data

Edit `DemoUserSeeder`: change the accounts, the member count, or add demo records for your own models. Use the factory states (`asAdmin()`, `asSuperadmin()`, `asUser()`, `inactive()`, `withRole(...)`) described in [Testing](/docs/digging-deeper/testing/#factory-states).

### Seeding your own reference data

Create a seeder with `php artisan make:seeder` and add it to `DatabaseSeeder`. Put it **before** the production check if the data is needed everywhere (like lookup tables), and inside `DemoUserSeeder` or after the check if it's only demo content.
