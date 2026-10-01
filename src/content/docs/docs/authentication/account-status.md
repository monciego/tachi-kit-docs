---
title: Account Status
description: Active and inactive accounts, who can change them, and how sign-in enforces them.
---

Every user has an `is_active` boolean (default `true`). Deactivating an account is a reversible alternative to deleting it: the user and their data stay, but they can't sign in.

## Where it's enforced

| Sign-in path | Enforced in | Result for an inactive user |
| --- | --- | --- |
| Email and password | `Fortify::authenticateUsing()` in `FortifyServiceProvider` | Validation error: "Your account is inactive. Please contact an administrator." A failed login entry is logged, marked `(account inactive)`. |
| Passkey | `Passkeys::authorizeLoginUsing()` | Generic credential error |

The check runs **at sign-in**. It deliberately isn't a global query scope: a scope would hide the user before the "inactive" message could be shown, and would make them vanish from the Users page.

:::caution
Deactivating a user blocks **new** sign-ins. A session that's already open keeps working until it expires or the user signs out. If you need immediate lockout, see [Ending active sessions](#ending-active-sessions) below.
:::

## Changing a user's status

On the Users page, open a row's action menu and choose **Deactivate** or **Activate**. This sends `PATCH /users/{user}/status` with `is_active`, handled by `UserController::updateStatus()`.

`UserPolicy::updateStatus()` allows it only when:

- the actor has the `users.status` permission,
- the target isn't the actor ("You cannot change your own account status."), and
- the target isn't a superadmin being **deactivated** ("Superadmin accounts cannot be deactivated.").

Superadmins go through the same policy checks. `Gate::before` deliberately doesn't bypass `updateStatus`, so even a superadmin can't lock themselves or another superadmin out.

Each actual change logs `UserActivated` or `UserDeactivated` to the activity log. Setting the status it already has does nothing.

The Users table shows a status badge (`UserStatusBadge`) and has a **Status** filter (`?status=active` / `?status=inactive`).

## Customizing

### Ending active sessions

To sign out deactivated users immediately, add a small middleware to the `web` group:

```php
// app/Http/Middleware/EnsureUserIsActive.php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();

    if ($user instanceof User && ! $user->is_active) {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login')->withErrors([
            'email' => __('Your account is inactive. Please contact an administrator.'),
        ]);
    }

    return $next($request);
}
```

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
        HandleAppearance::class,
        HandleInertiaRequests::class,
        AddLinkHeadersForPreloadedAssets::class,
        EnsureUserIsActive::class,
    ]);
})
```

### Letting users reactivate themselves

The kit has no self-service reactivation, by design. To add one, create a signed-URL route that sets `is_active` back to `true`, and log `ActivityEvent::UserActivated` with the user as the causer.
