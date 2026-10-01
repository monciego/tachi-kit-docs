---
title: Role Management
description: Creating custom roles, choosing their permissions, and the rules for editing and deleting them.
---

The **Roles** page (`/roles`) lets authorized users define custom roles and decide exactly which [permissions](/docs/authorization/permissions/) each one grants.

| Piece | File |
| --- | --- |
| Controller | `app/Http/Controllers/RoleController.php` |
| Validation | `app/Http/Requests/StoreRoleRequest.php`, `UpdateRoleRequest.php` |
| Authorization | `app/Policies/RolePolicy.php` |
| API shape | `app/Http/Resources/RoleResource.php` |
| Pages | `resources/js/pages/roles/index.tsx`, `create.tsx`, `edit.tsx`, `columns.tsx` |

## The list

Each row shows the role name (with a **System** badge for built-in roles), its permissions, avatars of up to five members, and the member count. System roles are always listed first, then custom roles. You can search by name, sort by `id` or `name`, and page through results, all on the server (see [Data Tables](/docs/frontend/data-tables/)).

## Creating a role

`/roles/create` (needs `roles.create`) asks for:

- **Name**: required, unique, up to 255 characters.
- **Permissions**: at least one, chosen from checkboxes grouped by `Permission::group()` (Users, Roles, Activity…) and labeled with `Permission::label()`. Only values from `Permission::values()` are accepted.

## Editing a role

`/roles/{role}/edit` (needs `roles.edit`) lets you rename a role and change its permissions.

- **Custom roles** can be edited by anyone with `roles.edit`.
- **System roles** (`admin`, `user`) can only be edited by superadmins, and only their permissions: the page locks the name field, because the code refers to these roles by name. `RolePolicy::update` denies everyone else, and superadmins pass through the `Gate::before` bypass.
- The **`superadmin`** role is shown read-only. Superadmins pass every check anyway, so editing its permissions wouldn't change anything.

When the permission set actually changes, a **Permission changed** entry is logged with what was added and removed.

## Deleting a role

Needs `roles.delete`. The delete button only appears for custom roles, and it's disabled with an explanation while the role still has members. Enforced by `RolePolicy::delete`, **even for superadmins**:

- system roles can't be deleted, and
- a role with users can't be deleted. Reassign its members first.

## Customizing

### Showing more on the list

`RoleController::index()` eager-loads `permissions` and up to five `users` per role and counts members with `withCount('users')`. `RoleResource` decides which fields reach the page. To show something new, add it to the query and to `RoleResource::toArray()`, then add a column in `pages/roles/columns.tsx`.

:::tip
When passing a **single** resource to a page (like the edit page does), resolve it first: `RoleResource::make($role)->resolve()`. Passing the resource object directly wraps it in `{ data: … }`, and the page reads `undefined`. Paginated collections are fine as-is.
:::

### Restricting which permissions a role editor can grant

If some permissions should only ever be granted by superadmins, filter them in `StoreRoleRequest` and `UpdateRoleRequest`:

```php
'permissions.*' => [
    'required',
    'string',
    Rule::in(Permission::values()),
    function (string $attribute, mixed $value, Closure $fail) {
        if ($value === Permission::ActivityView->value && ! $this->user()->isSuperadmin()) {
            $fail(__('Only superadmins can grant access to the activity log.'));
        }
    },
],
```

Hide the same checkboxes on the create and edit pages for a consistent UI.
