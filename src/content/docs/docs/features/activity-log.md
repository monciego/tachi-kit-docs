---
title: Activity Log
description: The audit trail of user, role and sign-in events, and how to log your own events.
---

The activity log records who did what, and when, across users, roles and sign-ins. Entries read like this:

> **John Administrator**
> Deactivated user Jane Doe
> September 30, 2026 · 10:42 PM

It's built on [spatie/laravel-activitylog](https://spatie.be/docs/laravel-activitylog) v5 and stored in the `activity_log` table.

| Piece | File |
| --- | --- |
| Event catalog and logging API | `app/Enums/ActivityEvent.php` |
| Sign-in listener | `app/Listeners/LogAuthenticationActivity.php` |
| Viewer | `app/Http/Controllers/ActivityController.php`, `resources/js/pages/activity/` |
| Authorization | `app/Policies/ActivityPolicy.php` (`activity.view`) |
| Retention | `routes/console.php` (`activitylog:clean`) |

## Events

| Event | Value | Logged when | Example sentence |
| --- | --- | --- | --- |
| User created | `user.created` | An admin creates a user, or someone signs up | Created user Jane Doe · Created their account |
| User updated | `user.updated` | Name or email actually changes (admin or own profile) | Updated user Jane Doe · Updated their profile |
| User deleted | `user.deleted` | Single delete, bulk delete (one entry each), deleting your own account | Deleted user Jane Doe · Deleted their account |
| User activated | `user.activated` | Status changes to active | Activated user Jane Doe |
| User deactivated | `user.deactivated` | Status changes to inactive | Deactivated user Jane Doe |
| Role assigned | `user.role_assigned` | A role is added to a user (on create or edit) | Assigned role admin to Jane Doe |
| Role removed | `user.role_removed` | A role is taken away on edit | Removed role user from Jane Doe |
| Password changed | `user.password_changed` | Admin sets it, the user changes it, or a reset | Changed the password of Jane Doe · Changed their password · Reset their password |
| Permission changed | `role.permissions_changed` | A role's permission set changes | Changed permissions of role Editor |
| Login | `auth.login` | Any successful sign-in (password, passkey, remember-me) | Logged in |
| Logout | `auth.logout` | Signing out | Logged out |
| Failed login | `auth.login_failed` | Wrong credentials, or an inactive account | Failed login attempt for jane@example.com |

**Only real changes are logged.** Saving a form without changes, or setting a status the user already has, writes nothing.

:::note
Failed logins store the attempted **email only**, never the password. If the email belongs to an account, that user becomes the entry's actor, so admins can spot attacks on specific accounts.
:::

## What an entry stores

| Column / property | Contents |
| --- | --- |
| `event` | The event value, e.g. `user.deactivated` |
| `causer_type` / `causer_id` | Who did it (the signed-in user by default), or `NULL` for anonymous failed logins |
| `subject_type` / `subject_id` | What it was done to (a `User` or `Role`), if anything |
| `properties.causer_name` | The actor's name **at the time** |
| `properties.subject_name` | The subject's name **at the time** |
| `properties.ip` | The request IP |
| other properties | Event details: `role`, `changed`, `added`/`removed`, `email`, `reason`, `via` |

Storing names means an entry still reads "Deactivated user Jane Doe" after Jane is renamed or deleted.

## Viewing the log

Open **Activity log** in the sidebar (`/activity`). It's a standard server-driven [data table](/docs/frontend/data-tables/):

- **Search** matches the actor's name, the subject's name, or a failed-login email.
- **Event** filter (`?event=auth.login_failed,user.deleted`).
- Newest first, with a page size of 10 to 100.

### Who can see it

The page requires the **`activity.view`** permission (`ActivityPolicy::viewAny`). By default **only superadmins** have it. To share the log, grant `activity.view` to a role on the Roles page, or to `admin` in `RolePermissionSeeder`.

Non-superadmin viewers never see entries whose **actor or subject is a superadmin**, in line with [Superadmin Visibility](/docs/authorization/superadmin-visibility/).

## Logging an event

Call `log()` on an enum case right where the action happens:

```php
use App\Enums\ActivityEvent;

ActivityEvent::UserDeactivated->log($user);
```

```php
public function log(?Model $subject = null, array $properties = [], ?User $causer = null): void
```

- `$subject`: the model acted on. Its `name` attribute is saved as `subject_name`.
- `$properties`: extra details to store.
- `$causer`: defaults to the signed-in user. Pass one explicitly when nobody is signed in (e.g. registration, password reset) or when acting on someone's behalf.

```php
ActivityEvent::RoleAssigned->log($user, ['role' => 'admin']);
ActivityEvent::PasswordChanged->log($user, ['via' => 'reset'], causer: $user);
```

:::caution
Log explicitly. Don't add Spatie's `LogsActivity` trait to models: it records generic "updated" diffs, fires during seeding, and can't express events like "activated" or "failed login".
:::

## Customizing

### Adding an event

Say you want to log when a post is published.

1. Add a case, a label and a sentence in `ActivityEvent`:

   ```php
   case PostPublished = 'post.published';

   // label()
   self::PostPublished => 'Post published',

   // describe()
   self::PostPublished => __('Published post :name', ['name' => $subject]),
   ```

   `describe()` receives the stored entry; `$subject` is its `subject_name`. Give the post a `name` attribute, or pass `['title' => $post->title]` and read it with `$activity->getProperty('title')`.

2. Log it where the action happens:

   ```php
   $post->update(['published_at' => now()]);

   ActivityEvent::PostPublished->log($post);
   ```

The new event appears in the Event filter automatically, since the options come from `ActivityEvent::options()`. Add a test in `tests/Feature/ActivityLogTest.php`.

### Changing retention

`activitylog:clean` runs **daily** (`routes/console.php`) and deletes entries older than **365 days**. For that to happen in production, the Laravel scheduler must be running (see [Deployment](/docs/digging-deeper/deployment/)).

To keep entries for a different period, pass `--days` in the schedule:

```php
Schedule::command('activitylog:clean --days=90')->daily();
```

Or publish Spatie's config and change `clean_after_days`:

```bash
php artisan vendor:publish --tag=activitylog-config
```

To keep everything forever, remove the schedule line.

### Turning logging off

Set `ACTIVITYLOG_ENABLED=false` to stop writing entries, e.g. in a test environment. To remove the feature entirely, delete the `log()` calls, the listener, the controller and page, the `activity.view` permission (then run `tachi:types`), and the `activity` nav item.

### Recording more context

Everything in `$properties` is stored as JSON, so you can add details such as the user agent:

```php
ActivityEvent::Login->log(causer: $user, properties: ['agent' => request()->userAgent()]);
```

To add a property to **every** entry, add it to the defaults array in `ActivityEvent::log()` next to `ip`.
