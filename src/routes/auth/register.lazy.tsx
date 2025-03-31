import { createLazyFileRoute } from '@tanstack/react-router';
import Register from '../../features/auth/register';

export const Route = createLazyFileRoute('/auth/register')({
  component: Register,
});
