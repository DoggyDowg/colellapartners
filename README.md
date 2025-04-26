# Shadcn Admin Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global Search Command
- 10+ pages
- Extra custom components

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [Eslint](https://eslint.org/) & [Prettier](https://prettier.io/)

**Icons:** [Tabler Icons](https://tabler.io/icons)

## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)

## Admin User Setup

### Automatic Admin Assignment

The application supports automatic admin role assignment based on email domains. Users who sign up with email addresses from specified domains will automatically be assigned the admin role.

To configure the admin domains:

1. Edit the `.env.development` (for development) and `.env.production` (for production) files
2. Add or modify the `VITE_ADMIN_EMAIL_DOMAINS` variable with a comma-separated list of domains:
   ```
   VITE_ADMIN_EMAIL_DOMAINS=example.com,admin-domain.com
   ```

3. Run the migration in `migrations/04_create_admin_functions.sql` in your Supabase project to set up the necessary database functions and triggers.

This migration:
- Creates a `users` table with a `role` column to track user roles
- Creates an `is_admin()` function that the application uses to check admin status
- Sets up a trigger to automatically assign the admin role when a user signs up with an email from the specified domains

After applying the migration, new users who sign up with an email address from one of the specified domains will automatically receive admin privileges.
