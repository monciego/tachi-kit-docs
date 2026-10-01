---
title: Theming & Dark Mode
description: Color tokens, dark mode, chart colors, radius and fonts.
---

Tachi Kit uses Tailwind CSS 4 with shadcn/ui's token system. The whole look is controlled by CSS variables in `resources/css/app.css`. Change a token, and every component that uses it follows.

## Color tokens

Tokens are defined twice: once for light mode on `:root`, and once for dark mode on `.dark`. Colors use `oklch()`.

```css
:root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --border: oklch(0.922 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --chart-1: oklch(0.646 0.222 41.116);
    /* … */
}

.dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    /* … */
}
```

Tailwind exposes them as utilities (`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`…) through the `@theme` block at the top of the same file (`--color-primary: var(--primary);` and so on). Use these utilities in your own components instead of hard-coded colors, so light and dark mode both work.

| Token group | Used for |
| --- | --- |
| `background`, `foreground` | Page surface and text |
| `card`, `popover` | Cards, dropdowns and dialogs |
| `primary`, `secondary`, `accent`, `muted` | Buttons, highlights, subdued text |
| `destructive` | Delete buttons and errors |
| `border`, `input`, `ring` | Borders, inputs, focus rings |
| `sidebar-*` | The app sidebar |
| `chart-1` … `chart-5` | Chart series colors |

## Dark mode

The `dark` class on `<html>` switches the tokens. It's set:

- on the server, from the `appearance` cookie (`resources/views/app.blade.php` and the `HandleAppearance` middleware), so there's no flash of the wrong theme, and
- on the client by `useAppearance()` when the user picks Light, Dark or System in **Settings → Appearance**.

Tailwind's `dark:` variant targets it: `@custom-variant dark (&:is(.dark *));`.

## Customizing

### Brand colors

Change `--primary` (and `--primary-foreground` for text on it) in both `:root` and `.dark`, for example:

```css
:root {
    --primary: oklch(0.505 0.213 27.518);
    --primary-foreground: oklch(0.985 0 0);
}

.dark {
    --primary: oklch(0.637 0.237 25.331);
    --primary-foreground: oklch(0.145 0 0);
}
```

The [shadcn themes page](https://ui.shadcn.com/themes) generates complete token sets you can paste in.

### Chart colors

Charts pick colors from `--chart-1` to `--chart-5` in order. Give each series its own token and keep the order stable, so a series keeps its color when others are filtered out. Check that each color has enough contrast against the card background in both themes. The dashboard's sign-ups chart includes a table view for this reason.

### Corner radius

`--radius` (default `0.625rem`) drives `rounded-sm`, `rounded-md`, `rounded-lg` and `rounded-xl` across all components.

### Fonts

The kit uses **Geist**, loaded through the Laravel Vite plugin's font support in `vite.config.ts`:

```ts
laravel({
    // …
    fonts: [
        bunny('Geist', {
            weights: [400, 500, 600, 700],
        }),
    ],
}),
```

To change it, swap the font there and update `--font-sans` in the `@theme` block of `app.css`.
