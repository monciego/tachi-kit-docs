---
title: Toast Notifications
description: Showing success and error toasts from the server with Inertia flash data.
---

Toasts ("User Jane Doe created.", "Avatar updated.") are sent from the **server** as Inertia flash data and shown on the client with [Sonner](https://sonner.emilkowal.ski). You don't manage toast state in React.

## Sending a toast

In any controller action, flash a `toast` before redirecting:

```php
use Inertia\Inertia;

Inertia::flash('toast', [
    'type' => 'success',
    'message' => __('User :name created.', ['name' => $user->name]),
]);

return to_route('users.index');
```

| Key | Values |
| --- | --- |
| `type` | `success`, `info`, `warning` or `error` |
| `message` | The text to show. Wrap it in `__()` so it can be translated. |

## How it's displayed

`<Toaster />` (`components/ui/sonner.tsx`) is mounted once in `app.tsx`. It calls `useFlashToast()`, which listens for Inertia's `flash` event and calls `toast[type](message)`. The payload is typed as `FlashToast` in `resources/js/types/ui.ts`.

Because flash data survives the redirect, the toast appears on whichever page the user lands on, and it works with `back()` too.

## Customizing

### Toasts from the client

For purely client-side feedback, such as "Copied to clipboard", call Sonner directly:

```tsx
import { toast } from 'sonner';

toast.success('Copied to clipboard');
```

### Richer toasts

To add a description or an action button, extend the `FlashToast` type and pass the extra fields through in `useFlashToast()`:

```ts
// types/ui.ts
export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
    description?: string;
};

// hooks/use-flash-toast.ts
toast[data.type](data.message, { description: data.description });
```

### Position and style

Change the props on `<Toaster />` in `components/ui/sonner.tsx`, e.g. `position="top-center"` or `richColors`.
