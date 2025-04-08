import { createLazyFileRoute } from '@tanstack/react-router';
import PropertyDetailPage from './property.$id';

export const Route = createLazyFileRoute('/admin/property/$id')({
  component: PropertyDetailPage,
}); 