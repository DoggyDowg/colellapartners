import { createLazyFileRoute } from '@tanstack/react-router';
import Login from '../features/auth/login';

export const Route = createLazyFileRoute('/login')({
  component: Login,
}); 