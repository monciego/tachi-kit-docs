---
title: Versioning & Upgrades
description: How Tachi Kit is versioned, and what that means for apps you've already built.
---

Tachi Kit follows [semantic versioning](https://semver.org), `vMAJOR.MINOR.PATCH`, and is published on Packagist as `monciego/tachi-kit`.

| Release | Contains | Example |
| --- | --- | --- |
| **Patch** | Bug fixes, docs and small tweaks | `v1.0.0` → `v1.0.1` |
| **Minor** | New features that don't change existing ones | `v1.0.1` → `v1.1.0` |
| **Major** | Breaking changes: a new major version of Laravel, React or Inertia, a higher PHP requirement, or a restructured folder layout or convention | `v1.1.0` → `v2.0.0` |

`composer create-project` and `laravel new --using` always install the **latest stable tag**.

## Your app doesn't auto-update

A starter kit is a template, not a dependency. When you create an app from Tachi Kit, the code is copied into your project and becomes **yours**. Later releases of the kit only affect **new** projects. Nothing in your app changes when a new version is tagged.

To bring a later improvement into an existing app, apply it by hand:

1. Read the release notes on GitHub for the version you want.
2. Look at the diff between tags, for example `https://github.com/monciego/tachi-kit/compare/v1.0.0...v1.1.0`.
3. Copy the changes that matter to you into your app, then run your tests.

:::note
Because the code is yours, feel free to rename, remove or rewrite anything. The docs describe the kit as shipped; once you've changed something, your version is the source of truth.
:::

## Upgrading dependencies

The kit's dependencies are normal Composer and npm packages, so you update them the usual way:

```bash
composer update
npm update
```

After updating, run the full quality gate to catch anything that broke:

```bash
composer ci:check
```
