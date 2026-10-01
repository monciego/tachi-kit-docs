---
title: Profile & Settings
description: The account settings pages, avatar uploads, security options and appearance.
---

Every signed-in user has a **Settings** area (`/settings`, which redirects to `/settings/profile`), with three tabs defined in `resources/js/layouts/settings/layout.tsx`:

| Tab | Route | Contents |
| --- | --- | --- |
| Profile | `/settings/profile` | Avatar, name, email, delete account |
| Security | `/settings/security` | Change password, two-factor authentication, passkeys |
| Appearance | `/settings/appearance` | Light, dark or system theme |

## Profile

`Settings\ProfileController`:

- **`update`**: saves name and email. Changing the email clears `email_verified_at`. Logs **User updated** when something actually changed.
- **`destroy`**: deletes the account after confirming the current password (`ProfileDeleteRequest`), logs **User deleted**, then signs the user out.

## Avatars

Users upload a photo with **Upload photo** / **Change photo** and can **Remove** it. The component is `resources/js/components/avatar-upload.tsx`; the endpoints are `POST /settings/avatar` and `DELETE /settings/avatar` (`Settings\AvatarController`).

- **Validation** (`AvatarUpdateRequest`): an image of type JPG, JPEG, PNG or WebP, up to `config('tachi.avatars.max_kilobytes')` (2048 KB).
- **Storage**: files go into an `avatars/` directory on the disk set by `AVATAR_DISK` (`public` by default). Uploading a new photo deletes the old file.
- **Database**: the path is stored in `users.avatar_path`, which is hidden from serialization.
- **URL**: `User` appends an `avatar` attribute with the public URL, or `null`. The frontend only ever uses `user.avatar`.

Avatars appear in the header and sidebar menus, the Users table, the Roles member stack, the dashboard's recent users, and the activity log. When there's no photo, initials are shown (`useInitials()`).

:::caution
The `public` disk serves files from `storage/app/public` through the `public/storage` symlink. Run `php artisan storage:link` once per environment, or avatar URLs will 404.
:::

## Security

`/settings/security` asks for the user's password first (Laravel's `RequirePassword` middleware), then offers:

- **Change password** (`PUT /settings/password`, limited to 6 attempts per minute). Requires the current password and follows the app's [password rules](/docs/authentication/overview/#password-rules). Logs **Password changed**.
- **Two-factor authentication**: enable, show the QR code and secret, confirm with a code, view or regenerate recovery codes, and disable. Built on Fortify (`manage-two-factor.tsx`, `two-factor-setup-modal.tsx`, `two-factor-recovery-codes.tsx`).
- **Passkeys**: register, name and remove passkeys (`manage-passkeys.tsx`). A `/.well-known/passkey-endpoints` route tells password managers where passkeys are managed.

## Appearance

Users choose **Light**, **Dark** or **System**. The choice is saved in `localStorage` and in an `appearance` cookie, so the server can render the right theme on first paint (`HandleAppearance` middleware), and the `dark` class is toggled on `<html>`. Read or change it in React with `useAppearance()`:

```tsx
const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

updateAppearance('dark');
```

## Customizing

### Storing avatars on S3

Configure the `s3` disk in `.env` (standard Laravel variables), then switch the avatar disk:

```dotenv
AVATAR_DISK=s3
```

No code changes are needed: storage and URLs both go through `config('tachi.avatars.disk')`. The bucket must allow public reads of the `avatars/` prefix. Otherwise, generate temporary URLs in the `User::avatar()` accessor instead of `url()`.

### Changing size or file types

Change `max_kilobytes` in `config/tachi.php`, and the allowed types in `AvatarUpdateRequest::rules()` (`File::image()->types([...])`). Update the hint text and the `accept` attribute in `avatar-upload.tsx` to match.

### Adding a settings tab

1. Add a route in `routes/settings.php` inside the `auth` group, e.g. `Route::inertia('settings/notifications', 'settings/notifications')->name('notifications.edit');`.
2. Create `resources/js/pages/settings/notifications.tsx`. Pages under `settings/` automatically get the app and settings layouts (see [Pages & Layouts](/docs/frontend/pages-and-layouts/)).
3. Add an entry to the nav items in `resources/js/layouts/settings/layout.tsx`.

### Removing account self-deletion

Remove the `<DeleteUser />` section from `pages/settings/profile.tsx` and the `profile.destroy` route, then regenerate route helpers with `php artisan wayfinder:generate --with-form`.
