---
title: User Management
description: The Users pages, the rules behind them, and how to add columns, filters and fields.
---

The **Users** page (`/users`) lists every account the viewer is allowed to see, and lets authorized users create, edit, activate, deactivate and delete accounts.

| Piece | File |
| --- | --- |
| Controller | `app/Http/Controllers/UserController.php` |
| Validation | `app/Http/Requests/StoreUserRequest.php`, `UpdateUserRequest.php` |
| Authorization | `app/Policies/UserPolicy.php` |
| Pages | `resources/js/pages/users/index.tsx`, `create.tsx`, `edit.tsx` |
| Table columns and row actions | `resources/js/pages/users/columns.tsx` |
| Role picker | `resources/js/pages/users/roles-picker.tsx` |

## The list

`UserController::index()` builds everything on the server from the URL:

| Feature | Query string | Details |
| --- | --- | --- |
| Search | `?search=jane` | Matches name or email. |
| Role filter | `?role=admin,user` | Users with any of the roles. |
| Status filter | `?status=active` | `active`, `inactive`, or both (both means no filter). |
| Sorting | `?sort=name&direction=asc` | Sortable: `id`, `name`, `email`, `created_at` (default, newest first). |
| Page size | `?per_page=20` | 10, 20, 50 or 100. |

Two rows are always pinned to the top whatever the sort: **your own account** (with a "You" badge), then **superadmins** (visible to superadmins only). Each user has a readable code such as `USR-0042`, assigned by the `GeneratesUserCode` trait.

Each row has an action menu with **Edit**, **Activate/Deactivate** and **Delete**. Each item shows only when you have the permission and the action is allowed on that row.

## Creating and editing

- **Create** (`/users/create`): name, email, password (with confirmation) and at least one role.
- **Edit** (`/users/{user}/edit`): the same fields. Leave the password blank to keep the current one.
- Only superadmins can grant the `superadmin` role, and the role picker makes `superadmin` exclusive (selecting it clears the other roles).
- A superadmin's account is read-only to non-superadmins, and a superadmin can't remove their own `superadmin` role.

:::note
Access is decided by **permissions, not role names**. Both the pages and the form requests go through `UserPolicy`: `StoreUserRequest::authorize()` calls `can('create', User::class)` and `UpdateUserRequest::authorize()` calls `can('update', [$user, $request])`. Any role with `users.create` or `users.edit` can manage users, not just `admin`. See [Delegating user management](#delegating-user-management).
:::

## Deleting

- **Single delete**: `DELETE /users/{user}`. You can't delete yourself or a superadmin.
- **Bulk delete**: select rows and choose **Delete**. The dialog reports how many rows are protected (yourself and superadmins) and deletes only the rest (`POST /users/bulk-delete`). The server applies the same exclusions again.

Users are **soft-deleted** (`SoftDeletes` on the model), so their rows stay in the database with `deleted_at` set.

Every change is written to the [activity log](/docs/features/activity-log/): created, updated, deleted, activated or deactivated, role assigned or removed, and password changed.

## Customizing

### Adding a column to the list

1. Add the field to the row shape in `UserController::index()`:

   ```php
   $users = $users->through(fn (User $user): array => [
       'id' => $user->id,
       // ...
       'last_login_at' => $user->last_login_at?->toIso8601String(),
   ]);
   ```

2. Add it to the `User` interface and the column list in `resources/js/pages/users/columns.tsx`:

   ```tsx
   columnHelper.accessor('last_login_at', {
       header: ({ column }) => (
           <DataTableColumnHeader column={column} title="Last login" />
       ),
       cell: ({ row }) => row.original.last_login_at ?? 'Never',
   }),
   ```

3. To make it sortable, add its name to the `sortColumn([...])` list in the controller. Anything else falls back to `created_at`.

### Adding a filter

1. Read it in the controller with `DataTableRequest::filter()` and apply it:

   ```php
   $teams = $request->filter('team');

   // in the query:
   ->when($teams->isNotEmpty(), fn ($query) => $query->whereIn('team_id', $teams))
   ```

2. Add it to `server.filters` in `pages/users/index.tsx`. The `column` must be the id of a real table column:

   ```tsx
   { column: 'team', param: 'team', title: 'Team', options: teamOptions }
   ```

See [Data Tables](/docs/frontend/data-tables/) for how filters, search and sorting flow through the URL.

### Adding a field to the forms

1. Add the column in a migration and to `#[Fillable]` on `User`.
2. Validate it in `StoreUserRequest::rules()` and `UpdateUserRequest::rules()`.
3. Save it in `UserController::store()` and `update()`. In `update()`, add it to `$attributes`. If you also want it tracked in the activity log, add it to the `['name', 'email']` list whose changes are logged.
4. Add the input to `create.tsx` and `edit.tsx`, and pass the current value from `UserController::edit()`.

### Delegating user management

Because every check goes through permissions, you can give a subset of user management to a custom role without touching code. For example, a **Support** role that can view users and change their status, but not create, edit or delete them:

1. As a superadmin, open **Roles → Add Role**.
2. Name it `Support` and tick **View Users** and **Change User Status**.
3. Assign the role to your support staff on the Users page.

They'll see the Users page with only the **Activate/Deactivate** action. The policy still protects superadmins and prevents anyone from changing their own status.

### Adding a user detail page

There's no per-user page: the resource routes are registered with `->except('show')`. To add one, remove `'show'` from the exception in `routes/web.php`, add a `show()` action that calls `$this->authorize('view', $user)`, create `resources/js/pages/users/show.tsx`, and regenerate the route helpers with `php artisan wayfinder:generate --with-form`.
