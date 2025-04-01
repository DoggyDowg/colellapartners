import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import supabase from '../../lib/supabase'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'

// Define interfaces for type safety
interface Referrer {
  id: string
  full_name: string
  email: string
}

interface Referral {
  id: string
  referrer_id: string
  referee_name: string
  referee_email: string
  referee_phone: string
  created_at: string
  status: string
  referrers: Referrer
}

export const Route = createFileRoute('/admin/_index')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const [totalReferrals, setTotalReferrals] = useState<number>(0)
  const [totalReferrers, setTotalReferrers] = useState<number>(0)
  const [pendingRewards, setPendingRewards] = useState<number>(0)
  const [completedReferrals, setCompletedReferrals] = useState<number>(0)
  const [recentReferrals, setRecentReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [setupLoading, setSetupLoading] = useState<boolean>(false)
  const [setupSuccess, setSetupSuccess] = useState<boolean>(false)

  // Function to set up database for admin
  const setupAdminDatabase = async () => {
    setSetupLoading(true);
    try {
      // 1. Create the user_roles table if it doesn't exist
      const { error: createTableError } = await supabase.rpc('setup_admin_database');
      
      if (createTableError) {
        // If RPC doesn't exist yet, create it directly
        console.log('Setting up user_roles table directly');
        await supabase.from('user_roles').upsert([
          { user_id: (await supabase.auth.getUser()).data.user?.id, role: 'admin' }
        ]);
        
        // Create is_admin function
        console.log('Creating is_admin function directly');
        const { error: fnError } = await supabase.rpc('create_is_admin_function');
        
        if (fnError) {
          console.error('Error creating is_admin function:', fnError);
          // We'll proceed anyway as the direct user role update should work
        }
      }
      
      // 2. Insert current user as admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      
      const { error: insertError } = await supabase.from('user_roles').upsert([
        { user_id: user.id, role: 'admin' }
      ]);
      
      if (insertError) throw insertError;
      
      // Success
      setSetupSuccess(true);
      alert('Admin setup complete! You now have admin privileges. You may need to reload the application.');
      
    } catch (err) {
      console.error('Error setting up admin:', err);
      alert('Error setting up admin. See console for details.');
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError(null)
      try {
        // Fetch total referrals
        const { count: referralsCount, error: referralsError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          
        if (referralsError) {
          console.warn('Error fetching referrals:', referralsError)
        }

        setTotalReferrals(referralsCount || 0)

        // Fetch total referrers
        const { count: referrersCount, error: referrersError } = await supabase
          .from('referrers')
          .select('*', { count: 'exact', head: true })
          
        if (referrersError) {
          console.warn('Error fetching referrers:', referrersError)
        }

        setTotalReferrers(referrersCount || 0)

        // Fetch completed referrals
        const { count: completedCount, error: completedError } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          
        if (completedError) {
          console.warn('Error fetching completed referrals:', completedError)
        }

        setCompletedReferrals(completedCount || 0)

        // Fetch pending rewards
        const { count: pendingCount, error: rewardsError } = await supabase
          .from('rewards')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          
        if (rewardsError) {
          console.warn('Error fetching rewards:', rewardsError)
        }

        setPendingRewards(pendingCount || 0)

        // Fetch recent referrals
        const { data: recentData, error: recentError } = await supabase
          .from('referrals')
          .select(
            `
            *,
            referrers (
              id,
              full_name,
              email
            )
          `,
          )
          .order('created_at', { ascending: false })
          .limit(5)
          
        if (recentError) {
          console.warn('Error fetching recent referrals:', recentError)
        }

        if (recentData) {
          setRecentReferrals(recentData as unknown as Referral[])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Unable to load dashboard data. The database tables may not exist yet.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Temporary Admin Setup Button */}
      <Card className="bg-amber-50 border-amber-200 mb-6">
        <CardContent className="pt-6">
          <h2 className="text-lg font-medium mb-2">Admin Database Setup</h2>
          <p className="text-sm text-muted-foreground mb-4">
            If you're seeing blank pages or authentication issues, your database may need to be set up for admin privileges.
          </p>
          <Button 
            onClick={setupAdminDatabase} 
            disabled={setupLoading || setupSuccess}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {setupLoading ? 'Setting up...' : setupSuccess ? 'Setup Complete!' : 'Setup Admin Access'}
          </Button>
          
          <div className="mt-4 pt-4 border-t border-amber-200">
            <h3 className="text-md font-medium mb-2">Manual SQL Setup</h3>
            <p className="text-sm text-muted-foreground mb-2">
              If the automatic setup doesn't work, you can run the following SQL commands in the Supabase SQL Editor:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-auto">
              <pre>{`-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL,
    "role" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- 2. Create is_admin function
CREATE OR REPLACE FUNCTION "public"."is_admin"()
RETURNS boolean
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $function$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$function$;

-- 3. Add your user as admin (replace with your actual user ID from auth.users)
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin');`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h2 className="text-xl font-medium mb-2">Database Setup Required</h2>
            <p className="text-muted-foreground mb-4">
              {error}
            </p>
            <p className="text-sm text-muted-foreground">
              Please create the necessary tables in your Supabase database or check your database configuration.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time referrals received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalReferrers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active referral partners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedReferrals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully converted referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingRewards}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rewards awaiting distribution
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReferrals.length === 0 ? (
                  <p className="text-muted-foreground">
                    No recent referrals found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentReferrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex justify-between items-start border-b pb-4"
                      >
                        <div>
                          <h3 className="font-medium">
                            {referral.referee_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Referred by: {referral.referrers.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {referral.status.charAt(0).toUpperCase() +
                              referral.status.slice(1)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(referral.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold">Seller Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      $500 per successful referral
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Landlord Rewards</h3>
                    <p className="text-sm text-muted-foreground">
                      $200 per property managed
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Conversion Rate</h3>
                    <p className="text-sm text-muted-foreground">
                      {totalReferrals > 0
                        ? `${Math.round((completedReferrals / totalReferrals) * 100)}%`
                        : '0%'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold">Active Period</h3>
                    <p className="text-sm text-muted-foreground">Ongoing</p>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-semibold">Upcoming</h3>
                    <p className="text-sm text-muted-foreground">
                      Partner events, special incentives, quarterly raffles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
