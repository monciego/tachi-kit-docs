---
title: Navigation
description: Sidebar groups, permission-gated nav items, and the global search dialog.
---

All navigation is defined in one file, `resources/js/constants/navigation.ts`. The sidebar, the collapsed icon sidebar and the global search dialog all read from it, so a new page only needs to be added once.

## Nav items

```ts
export type NavItem = {
    id?: string;
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: PermissionName; // only shown to users with this permission
    role?: string;               // only shown to users with this role
    badge?: number;              // count bubble in the sidebar (hidden when 0)
    description?: string;        // shown and searched in global search
    category?: string;           // groups results in global search
};
```

The file exports these lists:

| Export | Where it shows |
| --- | --- |
| `MAIN_NAV_ITEMS` | Sidebar group **Platform** (Dashboard) |
| `ACCESS_CONTROL_NAV_ITEMS` | Sidebar group **Access Control** (Users, Roles, Activity log) |
| `FOOTER_NAV_ITEMS` | Sidebar footer links (Repository, Documentation) |
| `APP_NAV_ITEMS` | Everything searchable in global search (Platform and Access Control) |

For example, the Activity log entry:

```ts
{
    id: 'activity',
    title: 'Activity log',
    href: activity.index(),
    icon: History,
    permission: PERMISSIONS.ACTIVITY_VIEW,
    description: 'Review user, role and sign-in activity',
    category: 'Access Control',
},
```

## Visibility

`isNavItemVisible(item, can, userRoles)` hides an item unless the user has its `permission` (through `auth.can`) **and** its `role`, when those are set. A sidebar group with no visible items disappears entirely, so a plain `user` sees only **Platform**.

:::caution
Hiding a link doesn't protect the page. Always authorize the route on the server too (policy, `authorize()` or `can:` middleware).
:::

## Global search

Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>, or click the search button in the header, to open the command palette (`global-search-dialog.tsx`). It searches `APP_NAV_ITEMS` by title, description and category, groups results by `category`, and applies the same visibility rules as the sidebar.

## Customizing

### Adding a page to the sidebar

```ts
import { FileText } from 'lucide-react';
import posts from '@/routes/posts';

export const MAIN_NAV_ITEMS: NavItem[] = [
    // …
    {
        id: 'posts',
        title: 'Posts',
        href: posts.index(),
        icon: FileText,
        permission: PERMISSIONS.POSTS_VIEW,
        description: 'Write and publish posts',
        category: 'Content',
    },
];
```

Items added to `MAIN_NAV_ITEMS` or `ACCESS_CONTROL_NAV_ITEMS` appear in search automatically through `APP_NAV_ITEMS`.

### Adding a sidebar group

1. Export a new list, e.g. `CONTENT_NAV_ITEMS`, and spread it into `APP_NAV_ITEMS`.
2. In `resources/js/components/app-sidebar.tsx`, filter it with `isVisible` and render another group:

```tsx
<NavGroup label="Content" items={visibleContent} />
```

### Footer links

`FOOTER_NAV_ITEMS` points at the Tachi Kit repository and docs. Replace them with your own links (support, changelog…), or empty the array.
