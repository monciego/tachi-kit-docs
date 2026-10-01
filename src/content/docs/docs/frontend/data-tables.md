---
title: Data Tables
description: The server-driven DataTable, DataTableRequest, and a walkthrough for building your own list page.
---

Every list in Tachi Kit (Users, Roles, Activity log) uses one component: `resources/js/components/data-table.tsx`. It's built on TanStack Table v9 and is **server-driven**: the browser never filters, sorts or paginates. The server does, and the table just renders the current page.

## How it works

1. Every piece of table state (page, page size, sort, search, filters) lives in the **URL query string**, e.g. `/users?search=jane&role=admin&sort=name&direction=asc&page=2`.
2. When the user types, sorts or changes a filter, the table makes an Inertia `router.get()` visit to the same route with the new query string.
3. The controller reads the query, runs the query and returns one page as a Laravel paginator.
4. The table renders that page. The URL can be bookmarked or shared and restores the exact view.

:::caution
Don't add client-side filtering or pagination to list pages. It only sees the current page of data. Add query parameters to the controller instead.
:::

## Backend: `DataTableRequest`

Index actions type-hint `App\Http\Requests\DataTableRequest`. It reads the table's query string and falls back to safe defaults for anything invalid, so a hand-edited URL never breaks the page:

| Method | Returns |
| --- | --- |
| `perPage()` | `10`, `20`, `50` or `100` (`PER_PAGE_OPTIONS`), defaulting to `10` |
| `sortColumn(array $sortable, string $default)` | the requested `sort` if it's in `$sortable`, otherwise `$default` |
| `sortDirection()` | `'asc'` or `'desc'` (default) |
| `search()` | the trimmed `search` term, or `''` |
| `filter(string $key)` | the unique values of a comma-separated filter, e.g. `?role=admin,user` → `['admin', 'user']` |
| `isPastLastPage($paginator)` | `true` when `?page=` is beyond the last page, e.g. after deleting the last row on it |

:::tip
Always whitelist sort columns through `sortColumn()`. Passing `$request->query('sort')` straight to `orderBy()` would let anyone sort by any column.
:::

## Frontend: `<DataTable>`

```tsx
<DataTable
    columns={columns}
    data={paginator.data}
    paginator={paginator}
    server={{
        route: users.index().url,
        searchPlaceholder: 'Search users...',
        filters: [
            {
                column: 'roles',
                param: 'role',
                title: 'Role',
                options: roleOptions.map((role) => ({ label: role, value: role })),
            },
        ],
    }}
    enableRowSelection
    bulkActions={[/* … */]}
/>
```

| Prop | Description |
| --- | --- |
| `columns` | Column definitions (see below). |
| `data` / `paginator` | `paginator.data`, and the paginator itself for page info. |
| `server.route` | The URL the table navigates to, usually `something.index().url`. |
| `server.searchPlaceholder` | Placeholder text for the search box. |
| `server.filters` | Faceted filters: `{ column, param?, title, options }`. `column` must be the id of a real column; `param` is the query key if it differs. |
| `server.actions` | Extra toolbar content on the right, e.g. an "Add" button. |
| `server.*Param`, `pageSizeOptions`, `defaultPageSize` | Override query parameter names or page sizes (defaults: `search`, `page`, `per_page`, `sort`, `direction`, sizes 10/20/50/100). |
| `enableRowSelection` | Adds row checkboxes. The `select` column is injected for you; never add it to your columns. |
| `bulkActions` | Actions shown while rows are selected (see below). |

### Columns

Define columns in `pages/<feature>/columns.tsx` with TanStack v9's helper. The `DataTableFeatures` type comes first:

```tsx
import { createColumnHelper } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import type { DataTableFeatures } from '@/components/data-table-features';

const columnHelper = createColumnHelper<DataTableFeatures, Post>();

export const columns = columnHelper.columns([
    columnHelper.accessor('title', {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Title" />
        ),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        enableSorting: false,
    }),
]);
```

`DataTableColumnHeader` renders a sort menu for sortable columns. Set `enableSorting: false` on columns the server can't sort by.

### Bulk actions

```tsx
bulkActions={[
    {
        label: 'Delete',
        noun: 'users',
        isProtected: (user) => !user.deletable,
        confirmTitle: 'Delete selected users',
        confirmDescription: 'This will permanently delete the selected users.',
        onConfirm: (rows) => {
            router.post(users.bulkDelete().url, { ids: rows.map((user) => user.id) });
        },
    },
]}
```

`isProtected` marks rows that must be skipped, usually from a per-row flag the server sends (like `deletable`). The confirmation dialog reports how many selected rows are protected and how many will be affected, and disables Confirm when every row is protected. `onConfirm` only receives the unprotected rows. **Re-check the same rules on the server**, as `UserController::bulkDestroy()` does.

## Walkthrough: a new list page

Let's add a paginated, searchable **Posts** list with a status filter.

### 1. Controller

```php
public function index(DataTableRequest $request): Response|RedirectResponse
{
    $this->authorize('viewAny', Post::class);

    $search = $request->search();
    $statuses = $request->filter('status');

    $posts = Post::query()
        ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
        ->when($statuses->isNotEmpty(), fn ($query) => $query->whereIn('status', $statuses))
        ->orderBy($request->sortColumn(['title', 'created_at'], 'created_at'), $request->sortDirection())
        ->paginate($request->perPage())
        ->withQueryString();

    if ($request->isPastLastPage($posts)) {
        return to_route('posts.index', $request->except('page'));
    }

    return Inertia::render('posts/index', [
        'posts' => $posts->through(fn (Post $post): array => [
            'id' => $post->id,
            'title' => $post->title,
            'status' => $post->status,
            'created_at' => $post->created_at?->toIso8601String(),
        ]),
    ]);
}
```

Always call `->withQueryString()` so the pagination links keep the current filters. Map rows with `through()` so you send only the fields the table needs.

### 2. Route

```php
Route::get('posts', [PostController::class, 'index'])->name('posts.index');
```

### 3. Page

```tsx
// resources/js/pages/posts/index.tsx
import { DataTable } from '@/components/data-table';
import posts from '@/routes/posts';
import type { Paginator } from '@/types/table';
import { columns, type Post } from './columns';

export default function Index({ posts: paginator }: { posts: Paginator<Post> }) {
    return (
        <DataTable
            columns={columns}
            data={paginator.data}
            paginator={paginator}
            server={{
                route: posts.index().url,
                searchPlaceholder: 'Search posts...',
                filters: [
                    {
                        column: 'status',
                        title: 'Status',
                        options: [
                            { label: 'Draft', value: 'draft' },
                            { label: 'Published', value: 'published' },
                        ],
                    },
                ],
            }}
        />
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Posts', href: posts.index() }],
};
```

### 4. Navigation and tests

Add a nav item ([Navigation](/docs/frontend/navigation/)) and a feature test that covers search, the filter, sorting and authorization. `tests/Feature/UsersTest.php` has examples of each.
