import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  EnhancedUser,
  UserListFilters,
  UserListSorting,
  PaginationParams,
  UseEnhancedUsersReturn
} from '@/types/userLicense';

interface UseEnhancedUsersOptions {
  filters?: UserListFilters;
  sorting?: UserListSorting;
  pagination?: PaginationParams;
  autoRefresh?: boolean;
}

export const useEnhancedUsers = (options: UseEnhancedUsersOptions = {}): UseEnhancedUsersReturn => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Since the RPC function doesn't exist, use existing user_profiles table
      const { data, error: fetchError, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      if (fetchError) {
        throw fetchError;
      }

      const enhancedUsers: EnhancedUser[] = (data || []).map(user => ({
        id: user.id,
        email: user.name || 'No email',
        created_at: user.created_at,
        last_sign_in_at: user.updated_at,
        email_confirmed_at: user.created_at,
        user_metadata: {},
        license_active: false,
        license_expires_at: null,
        license_count: 0,
        active_licenses: 0,
        budget_count: 0,
        total_license_value: 0,
        last_license_activity: null,
      }));
      
      setUsers(enhancedUsers);
      setTotalCount(count || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching enhanced users:', err);
    } finally {
      setLoading(false);
    }
  }, [options.filters, options.sorting, options.pagination]);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  const pagination = {
    total: totalCount,
    page: options.pagination?.page || 1,
    limit: options.pagination?.limit || 10,
    totalPages: Math.ceil(totalCount / (options.pagination?.limit || 10)),
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(fetchUsers, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    refreshUsers,
  };
};