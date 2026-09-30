---
title: Introduction
description: What Tachi Kit is, what it includes, and how these docs are organized.
---

**Tachi Kit** is an opinionated Laravel + React + Inertia starter kit. It gives you authentication, role-based permissions, user management, a dashboard and an activity log on day one, so you can skip the boring parts and start on what makes your app unique.

The name comes from the *tachi*, a Japanese sword. The kit's job is to cut through the boilerplate every app needs before it can do anything interesting.

## What's included

| Area | What you get |
| --- | --- |
| Authentication | Login, registration, email verification, password reset, two-factor authentication and passkeys, powered by [Laravel Fortify](https://laravel.com/docs/fortify). Inactive accounts can't sign in. |
| Authorization | [spatie/laravel-permission](https://spatie.be/docs/laravel-permission) with built-in `superadmin`, `admin` and `user` roles, custom roles, permissions defined in a PHP enum, and policies that protect superadmins. |
| User management | Server-driven data tables with search, filters, sorting, pagination, bulk delete, account status and avatars. |
| Role management | Create custom roles and pick their permissions from a grouped checklist. |
| Dashboard | Stat cards, a monthly sign-ups chart and a recent users table, loaded as deferred props. |
| Activity log | An audit trail of user, role, password and sign-in events, built on [spatie/laravel-activitylog](https://spatie.be/docs/laravel-activitylog). |
| Profile settings | Name, email, avatar, password, 2FA, passkeys and appearance (light, dark or system). |
| Typed end to end | [Wayfinder](https://github.com/laravel/wayfinder) route helpers, TypeScript role and permission constants generated from PHP, and PHPStan at level 7. |
| Quality gates | Pest, Pint, PHPStan, oxlint, formatting and `tsc`, all wired into GitHub Actions. |

**Stack:** Laravel 13, React 19, Inertia 3, Tailwind CSS 4, shadcn/ui and Pest. Tachi Kit is built on the official [Laravel React starter kit](https://github.com/laravel/react-starter-kit) and keeps its conventions, so everything in the Laravel and Inertia docs still applies.

## Philosophy

- **Opinionated.** Decisions such as "superadmins are hidden from everyone else" or "permissions live in one enum" are already made and enforced in code and tests. You can change them, and these docs show where.
- **One source of truth.** Roles and permissions are PHP enums, and the TypeScript constants are generated from them. Routes are typed with Wayfinder. There's no second list to keep in sync by hand.
- **Server-driven.** Tables filter, sort and paginate on the server. The URL holds the state, so every view can be shared and bookmarked.
- **Tested.** Every guard, such as "a superadmin can't delete a system role", has a test. CI runs formatting, static analysis and the full suite.

## How to read these docs

- **Getting Started** takes you from nothing to a running app and explains configuration and layout.
- **Authentication** and **Authorization** explain how access works: who can sign in, and what they can do.
- **Features** covers each built-in screen and ends with how to customize it.
- **Frontend** covers the shared React building blocks (data tables, navigation, components, theming) that you'll use for your own features.
- **Digging Deeper** covers Artisan commands, seeding, testing and deployment.

:::tip
Most pages end with a **Customizing** section. If you only want to change something, you can usually jump straight there.
:::
