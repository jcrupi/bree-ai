import { useEffect, useState } from 'react';
import { api } from '../utils/api-client';

export function useApiExample() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error: apiError } = await api.api.users.get();
        
        if (apiError) {
          setError('Failed to fetch users');
          return;
        }
        
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}
