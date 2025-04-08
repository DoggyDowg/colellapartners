import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/property/$id')({
  component: () => import('./property.$id').then((mod) => mod.default),
}); 