import { createLazyFileRoute } from '@tanstack/react-router';
import ForSalePageContent from '@/features/properties/for-sale';

export const Route = createLazyFileRoute('/for-sale')({
  component: ForSalePageContent,
}); 