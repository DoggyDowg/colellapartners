import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconUserPlus, IconGift, IconAward } from '@tabler/icons-react';
import { Wrench } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform right now</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button asChild variant="outline" className="flex flex-col h-20 py-2">
            <Link to="/referrals">
              <IconUserPlus className="h-5 w-5 mb-1" />
              <span>Add Referral</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex flex-col h-20 py-2">
            <Link to="/rewards">
              <IconGift className="h-5 w-5 mb-1" />
              <span>View Rewards</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex flex-col h-20 py-2">
            <Link to="/achievements">
              <IconAward className="h-5 w-5 mb-1" />
              <span>Achievements</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex flex-col h-20 py-2">
            <Link to="/referral-toolkit">
              <Wrench className="h-5 w-5 mb-1" />
              <span>Referral Toolkit</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 