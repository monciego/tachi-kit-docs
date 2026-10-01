// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'Tachi Kit',
            description:
                'Documentation for Tachi Kit, an opinionated Laravel + React + Inertia starter kit.',
            logo: {
                src: './src/assets/logo.svg',
            },
            favicon: '/favicon.svg',
            customCss: ['./src/styles/global.css'],
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/monciego/tachi-kit',
                },
            ],
            lastUpdated: false,
            sidebar: [
                {
                    label: 'Prologue',
                    items: [
                        { label: 'Introduction', slug: 'docs' },
                        { label: 'Versioning & Upgrades', slug: 'docs/prologue/versioning' },
                    ],
                },
                {
                    label: 'Getting Started',
                    items: [
                        { label: 'Installation', slug: 'docs/installation' },
                        { label: 'Configuration', slug: 'docs/configuration' },
                        { label: 'Directory Structure', slug: 'docs/directory-structure' },
                        { label: 'Development Workflow', slug: 'docs/development' },
                    ],
                },
                {
                    label: 'Authentication',
                    items: [
                        { label: 'Overview', slug: 'docs/authentication/overview' },
                        { label: 'Registration', slug: 'docs/authentication/registration' },
                        { label: 'Account Status', slug: 'docs/authentication/account-status' },
                    ],
                },
                {
                    label: 'Authorization',
                    items: [
                        { label: 'Roles', slug: 'docs/authorization/roles' },
                        { label: 'Permissions', slug: 'docs/authorization/permissions' },
                        { label: 'Policies', slug: 'docs/authorization/policies' },
                        {
                            label: 'Superadmin Visibility',
                            slug: 'docs/authorization/superadmin-visibility',
                        },
                    ],
                },
                {
                    label: 'Features',
                    items: [
                        { label: 'User Management', slug: 'docs/features/user-management' },
                        { label: 'Role Management', slug: 'docs/features/role-management' },
                        { label: 'Dashboard', slug: 'docs/features/dashboard' },
                        { label: 'Activity Log', slug: 'docs/features/activity-log' },
                        { label: 'Profile & Settings', slug: 'docs/features/profile-settings' },
                        { label: 'Landing Page & Branding', slug: 'docs/features/landing-page' },
                    ],
                },
                {
                    label: 'Frontend',
                    items: [
                        { label: 'Pages & Layouts', slug: 'docs/frontend/pages-and-layouts' },
                        { label: 'Data Tables', slug: 'docs/frontend/data-tables' },
                        { label: 'Navigation', slug: 'docs/frontend/navigation' },
                        { label: 'Components & Hooks', slug: 'docs/frontend/components' },
                        { label: 'Toast Notifications', slug: 'docs/frontend/notifications' },
                        { label: 'Theming & Dark Mode', slug: 'docs/frontend/theming' },
                        { label: 'Typed Routes', slug: 'docs/frontend/routing' },
                    ],
                },
                {
                    label: 'Digging Deeper',
                    items: [
                        { label: 'Artisan Commands', slug: 'docs/digging-deeper/artisan-commands' },
                        { label: 'Seeding', slug: 'docs/digging-deeper/seeding' },
                        { label: 'Testing', slug: 'docs/digging-deeper/testing' },
                        { label: 'Deployment', slug: 'docs/digging-deeper/deployment' },
                    ],
                },
            ],
        }),
    ],
    vite: {
        plugins: [tailwindcss()],
    },
});
