import { useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

export function SignOutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/auth' });
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
} 