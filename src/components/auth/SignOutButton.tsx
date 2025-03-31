import { useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

export function SignOutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/auth/login' });
  };

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
} 