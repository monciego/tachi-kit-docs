---
title: Components & Hooks
description: shadcn/ui primitives, the kit's own components, and the hooks you'll reuse.
---

## shadcn/ui

`resources/js/components/ui/` holds [shadcn/ui](https://ui.shadcn.com) components (new-york style, neutral base color, configured in `components.json`): `button`, `card`, `dialog`, `dropdown-menu`, `table`, `badge`, `avatar`, `chart`, `command`, `select`, `sheet`, `sidebar`, `skeleton`, `tooltip` and more.

These files are yours to edit, but they're excluded from linting and formatting so they stay close to upstream.

### Adding a component

```bash
npx shadcn@latest add accordion
```

:::caution
- If the CLI asks to overwrite an existing file (for example `card.tsx`), answer **no** unless you want to lose local changes.
- Check that new files import `cn` from `@/lib/utils`. The kit standardizes on that helper.
:::

## Kit components

| Component | File | Use it for |
| --- | --- | --- |
| `DataTable` | `data-table.tsx` | Server-driven lists. See [Data Tables](/docs/frontend/data-tables/). |
| `DataTableColumnHeader` | `data-table-column-header.tsx` | Sortable column headers. |
| `StatCard`, `StatCardSkeleton` | `stat-card.tsx` | A metric with title, icon and description. |
| `UserStatusBadge` | `user-status-badge.tsx` | "Active" / "Inactive" pill. |
| `DeleteDialog` | `delete-dialog.tsx` | A confirmation dialog for deleting something (`item`, `onDelete`, `title`, `description`, `canDelete`, `warningMessage`, `triggerButton`, controlled `open`). |
| `AvatarUpload` | `avatar-upload.tsx` | The profile photo uploader. |
| `UserAvatarStack` | `user-avatar-stack.tsx` | Overlapping avatars with a "+N" count. |
| `Heading` | `heading.tsx` | Section headings in settings pages. |
| `InputError` | `input-error.tsx` | Validation messages under inputs. |
| `PasswordInput` | `password-input.tsx` | A password field with a show/hide toggle. |
| `GlobalSearchDialog` | `global-search-dialog.tsx` | The <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>K</kbd> palette. |

### `StatCard`

```tsx
<StatCard
    title="Active users"
    value={stats.active_users}
    icon={UserCheck}
    description="92% of all users"
/>
```

`value` is a number, formatted for the user's locale. `description` accepts text or JSX, e.g. a trend icon with a label.

### `DeleteDialog`

```tsx
<DeleteDialog
    item={{ id: role.id, name: role.name }}
    type="role"
    onDelete={() => router.delete(roles.destroy(role.id).url)}
    canDelete={role.users_count === 0}
    warningMessage="Remove all members before deleting this role."
/>
```

## Hooks

| Hook | File | Returns |
| --- | --- | --- |
| `usePermissions()` | `hooks/use-permissions.ts` | `can`, `cannot`, `canAny`, `canAll`, `hasRole`. See [Permissions](/docs/authorization/permissions/#5-check-it-on-the-frontend). |
| `useAppearance()` | `hooks/use-appearance.tsx` | `appearance`, `resolvedAppearance`, `updateAppearance(mode)` |
| `useInitials()` | `hooks/use-initials.tsx` | A function turning "Jane Doe" into "JD" (avatar fallbacks) |
| `useFlashToast()` | `hooks/use-flash-toast.ts` | Shows server flash toasts; already mounted in the app shell |
| `useClipboard()` | `hooks/use-clipboard.ts` | Copy-to-clipboard helper |
| `useIsMobile()` | `hooks/use-mobile.tsx` | Whether the viewport is mobile-sized |
| `useCurrentUrl()` | `hooks/use-current-url.ts` | Current URL helpers, used for active nav items |

## Utilities

- `cn(...classes)` in `@/lib/utils` merges Tailwind classes (`clsx` + `tailwind-merge`).
- `getRoleColor(role)` and `getRoleBadgeVariant(role)` in `@/utils/role-color` give every role a consistent badge style: fixed styles for system roles, and a stable color picked from the name for custom roles.

## Customizing

Kit components are ordinary files in your project, so change them freely. When you change a shared one (`DataTable`, `StatCard`, `DeleteDialog`), check every page that uses it. `npm run types:check` catches prop changes.
