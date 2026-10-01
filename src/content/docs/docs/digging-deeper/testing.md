---
title: Testing
description: The Pest test suite, factory states, and patterns for testing permissions, Inertia pages and activity.
---

Tachi Kit is tested with [Pest](https://pestphp.com). Feature tests cover every page, guard and command in the kit.

## Running tests

```bash
php artisan test --compact                                  # everything
php artisan test --compact tests/Feature/UsersTest.php      # one file
php artisan test --compact --filter="deletes a user"        # one test
```

Tests run against an **in-memory SQLite** database (`phpunit.xml`). Every feature test uses `RefreshDatabase` automatically (`tests/Pest.php`), so each test starts empty.

In CI, `composer ci:check` runs the tests together with formatting, linting, type checks and PHPStan. See [Development Workflow](/docs/development/#quality-gates).

## Factory states

`Database\Factories\UserFactory` has states for the kit's common cases:

| State | Result |
| --- | --- |
| `asSuperadmin()` | Has the `superadmin` role |
| `asAdmin()` | Has the `admin` role |
| `asUser()` | Has the `user` role |
| `withRole(RoleName\|string $role)` | Has any role, created if missing |
| `inactive()` | `is_active = false` |
| `unverified()` | `email_verified_at = null` |
| `withTwoFactor()` | Two-factor authentication configured |

```php
$admin = User::factory()->asAdmin()->create();
$jane = User::factory()->asUser()->inactive()->create(['name' => 'Jane Doe']);
```

## Patterns

### Seed permissions first

Roles only have their permissions once `RolePermissionSeeder` has run. Seed it in `beforeEach` for tests that depend on permissions:

```php
beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});
```

### Testing authorization

Test both the allowed and the forbidden case, and include a superadmin where the `Gate::before` bypass has exceptions:

```php
test('admins cannot delete a superadmin', function () {
    $superadmin = User::factory()->asSuperadmin()->create();

    $this->actingAs(User::factory()->asAdmin()->create())
        ->delete(route('users.destroy', $superadmin))
        ->assertForbidden();
});
```

For one-off roles, create a role with exactly the permissions under test:

```php
$role = Role::query()->create(['name' => 'Role Manager']);
$role->givePermissionTo(Permission::RolesEdit->value);

$user = User::factory()->create()->assignRole($role);
```

### Testing Inertia pages

```php
$this->actingAs($admin)
    ->get(route('users.index', ['search' => 'jane']))
    ->assertOk()
    ->assertInertia(fn (Assert $page) => $page
        ->component('users/index')
        ->has('users.data', 1)
        ->where('users.data.0.name', 'Jane Doe')
    );
```

Deferred props (like the dashboard's) are loaded with `loadDeferredProps()`:

```php
->assertInertia(fn (Assert $page) => $page
    ->missing('stats')
    ->loadDeferredProps(fn (Assert $reload) => $reload->where('stats.total_users', 4))
);
```

### Testing toasts

```php
$this->post(route('roles.store'), $payload)
    ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Role Auditor created.']);
```

### Testing the activity log

Query the `Activity` model by event:

```php
use Spatie\Activitylog\Models\Activity;

$activity = Activity::query()->where('event', ActivityEvent::UserDeactivated->value)->sole();

expect($activity->subject_id)->toBe($jane->id)
    ->and(ActivityEvent::UserDeactivated->describe($activity))->toBe('Deactivated user Jane Doe');
```

`actingAs()` doesn't fire the `Login` event, so only tests that post to `login.store` produce login entries.

### Time-dependent tests

Pin the clock with `$this->travelTo(...)` so date-based results (like the dashboard's monthly chart) are deterministic.

## Customizing

When you change a guard on purpose, for example letting admins view the activity log, update the test that asserted the old behavior instead of deleting it. Each test in the suite documents a decision.
