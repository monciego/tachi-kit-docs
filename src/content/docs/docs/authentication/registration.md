---
title: Registration
description: Public sign-up, the default role for new accounts, and closing registration.
---

Tachi Kit supports two ways of getting an account:

1. **Public sign-up** at `/register`, if you allow it.
2. **Created by an admin** on the Users page. This always works, regardless of the sign-up setting. See [User Management](/docs/features/user-management/).

## Turning public sign-up on or off

```dotenv
ALLOWS_PUBLIC_REGISTRATION=false
```

This maps to `config('tachi.registration.public')`. When it's `false`:

- `GET /register` returns **404** (the `Fortify::registerView` closure).
- `POST /register` returns **404** before a user is created (the `Fortify::createUsersUsing` factory).
- Sign-up links disappear. The shared Inertia prop `canRegister` is `false`, and the login page and landing page hide their "Sign up" links.

:::note
The config default is `false`, but `.env.example` sets it to `true` so a fresh local install can sign up straight away. Set it explicitly in production.
:::

## What happens when someone signs up

`app/Actions/Fortify/CreateNewUser.php`:

1. Validates name, email (unique) and password, using `ProfileValidationRules` and `PasswordValidationRules`.
2. Creates the user. The `hashed` cast hashes the password, and the `GeneratesUserCode` trait assigns a code such as `USR-0042`.
3. Assigns the **`user`** role (`RoleName::User`).
4. Logs `ActivityEvent::UserCreated` with the new user as the actor ("Created their account").

Fortify then signs the user in and redirects them to the dashboard.

:::caution
New sign-ups always get the plain `user` role. `superadmin` and `admin` are only ever assigned by seeding, `tachi:superadmin`, or another admin. Don't let a sign-up form choose its own role.
:::

## Customizing

### Collecting extra fields

1. Add the column in a migration and to `#[Fillable]` on `App\Models\User`.
2. Add the input to `resources/js/pages/auth/register.tsx`.
3. Validate and save it in `CreateNewUser::create()`:

```php
Validator::make($input, [
    ...$this->profileRules(),
    'company' => ['required', 'string', 'max:255'],
    'password' => $this->passwordRules(),
])->validate();

$user = User::create([
    'name' => $input['name'],
    'email' => $input['email'],
    'company' => $input['company'],
    'password' => $input['password'],
]);
```

### Giving new sign-ups a different role

Create the role (a custom role, or a new case on `RoleName` if it should be a protected system role), then change the `assignRole()` call in `CreateNewUser`:

```php
$user->assignRole(Role::query()->firstOrCreate(['name' => 'member']));
```

### Invite-only apps

Keep public registration off and create accounts from the Users page, or build an invitation flow that calls the same `User::query()->create()` + `assignRole()` code as `UserController::store()`.
