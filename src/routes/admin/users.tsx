import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import supabase from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';

// Define interfaces for our data
interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  is_active: boolean;
  profile?: UserProfile;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  company_name: string | null;
  created_at: string;
}

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
});

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Role options
  const roleOptions = [
    'admin',
    'partner',
    'agent',
    'user'
  ];

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          profile: profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply role filter
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      // Apply status filter
      if (statusFilter) {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        let filteredData = data as User[];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            user => 
              user.email.toLowerCase().includes(query) ||
              user.profile?.first_name?.toLowerCase().includes(query) ||
              user.profile?.last_name?.toLowerCase().includes(query) ||
              user.profile?.company_name?.toLowerCase().includes(query)
          );
        }
        
        setUsers(filteredData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      // If this is the selected user, update it too
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
      
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        )
      );
      
      // If this is the selected user, update it too
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: isActive });
      }
      
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Are you sure you want to send a password reset email to ${email}?`)) {
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      alert(`Password reset email sent to ${email}`);
      
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset email. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // First delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        throw profileError;
      }
      
      // Then delete user from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Close dialog if open
      if (isDialogOpen) {
        setIsDialogOpen(false);
      }
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      alert(`User ${email} has been deleted successfully`);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    fetchUsers();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFullName = (user: User) => {
    if (!user.profile) return 'N/A';
    return `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || 'N/A';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search by email, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => fetchUsers()}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {roleOptions.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Users
            {!loading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({users.length} {users.length === 1 ? 'user' : 'users'})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {getFullName(user)}
                          {user.profile?.company_name && (
                            <span className="ml-1">({user.profile.company_name})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role}
                          onValueChange={(newRole) => handleUpdateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={user.is_active} 
                            onCheckedChange={(isActive) => handleToggleUserStatus(user.id, isActive)}
                          />
                          <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(user.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(user.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResetPassword(user.email)}
                          >
                            Reset Password
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Manage user: {selectedUser.email}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Account Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                      <p>
                        <span className="font-medium">Role:</span> {selectedUser.role}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Profile Information</h3>
                    <div className="mt-1 space-y-2">
                      <p>
                        <span className="font-medium">Name:</span> {getFullName(selectedUser)}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {selectedUser.profile?.phone_number || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Company:</span> {selectedUser.profile?.company_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Dates & Activity</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">Registration Date:</span> {formatDateTime(selectedUser.created_at)}</p>
                      <p><span className="font-medium">Last Sign In:</span> {formatDateTime(selectedUser.last_sign_in_at)}</p>
                      <p><span className="font-medium">Profile Created:</span> {selectedUser.profile ? formatDateTime(selectedUser.profile.created_at) : 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
                    <div className="mt-1 space-y-2">
                      <p><span className="font-medium">User ID:</span> {selectedUser.id}</p>
                      {selectedUser.profile && (
                        <p><span className="font-medium">Profile ID:</span> {selectedUser.profile.id}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">User Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetPassword(selectedUser.email)}
                  >
                    Reset Password
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(selectedUser.id, !selectedUser.is_active)}
                  >
                    {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleDeleteUser(selectedUser.id, selectedUser.email);
                    }}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminUsers; 