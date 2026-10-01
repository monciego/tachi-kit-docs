---
title: Policies
description: The kit's policies, the superadmin bypass and its exceptions, and adding your own.
---

Authorization decisions live in [Laravel policies](https://laravel.com/docs/authorization#creating-policies). Controllers call `$this->authorize(...)`, form requests call `$this->user()->can(...)`, and the policy decides.

## Registered policies

`AppServiceProvider::boot()` registers them explicitly:

```php
Gate::policy(User::class, UserPolicy::class);
Gate::policy(Role::class, RolePolicy::class);
Gate::policy(Activity::class, ActivityPolicy::class);
```

### `UserPolicy`

| Ability | Allowed when |
| --- | --- |
| `viewAny` / `view` | `users.view` |
| `create` | `users.create` |
| `update` | `users.edit`, **and** the target isn't a superadmin (unless you are one), **and** you aren't a superadmin removing your own `superadmin` role |
| `updateStatus` | `users.status`, **and** the target isn't you, **and** you aren't deactivating a superadmin |
| `delete` | `users.delete`, **and** the target isn't you, **and** the target isn't a superadmin |

`update` and `updateStatus` receive the `Request` as an extra argument, because their rules depend on what's being submitted (the new roles, the new status):

```php
$this->authorize('update', [$user, $request]);
```

`delete` and `updateStatus` return `Response::deny('…')` messages, which Laravel shows on the 403 page.

### `RolePolicy`

| Ability | Allowed when |
| --- | --- |
| `viewAny` / `view` | `roles.view` |
| `create` | `roles.create` |
| `update` | `roles.edit` and the role isn't a system role |
| `delete` | `roles.delete`, the role isn't a system role, **and** no users hold it |

### `ActivityPolicy`

| Ability | Allowed when |
| --- | --- |
| `viewAny` | `activity.view` |

## The superadmin bypass

`AppServiceProvider` gives superadmins every ability with a `Gate::before` callback. There are three exceptions, where the callback returns `null` so the policy still decides:

```php
Gate::before(function (User $user, string $ability, array $arguments) {
    if ($user->isSuperadmin()) {
        if ($ability === 'updateStatus') {
            return null; // can't change own status or deactivate a superadmin
        }

        if ($ability === 'delete' && ($arguments[0] ?? null) instanceof Role) {
            return null; // can't delete system roles or roles still in use
        }

        if ($ability === 'update') {
            $subject = $arguments[0] ?? null;

            if ($subject instanceof User && $subject->is($user)) {
                return null; // can't demote themselves
            }
        }

        return true;
    }
});
```

The bypass also covers permission checks made through the gate (`$user->can('users.view')`, `can:` middleware, and the `auth.can` map), so superadmins see every permission as `true` even before permissions are seeded.

:::note
`$user->checkPermissionTo()` asks Spatie directly and does **not** go through `Gate::before`. That's why the seeder still grants superadmin every permission: policies that call `checkPermissionTo()` get the right answer either way.
:::

## Customizing

### Adding a policy for your own model

```bash
php artisan make:policy PostPolicy --model=Post
```

```php
class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->checkPermissionTo(Permission::PostsView->value);
    }

    public function update(User $user, Post $post): bool
    {
        return $post->author()->is($user)
            || $user->checkPermissionTo(Permission::PostsEdit->value);
    }
}
```

Laravel discovers `App\Policies\PostPolicy` for `App\Models\Post` automatically. Register it next to the others in `AppServiceProvider` if you prefer it to be explicit, as the kit does.

Then authorize in the controller:

```php
public function update(UpdatePostRequest $request, Post $post): RedirectResponse
{
    $this->authorize('update', $post);
    // ...
}
```

### Keeping a rule even for superadmins

If an ability must apply to superadmins too, for example "nobody can delete a published invoice", add an exception to `Gate::before` the same way as the three above, and write a test that acts as a superadmin. The `RolesTest` test "forbids deleting system roles, even for superadmins" is an example.
