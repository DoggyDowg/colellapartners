import { createLazyFileRoute } from '@tanstack/react-router';
import Register from '../features/auth/register';

export const Route = createLazyFileRoute('/register')({
  component: Register,
}); 