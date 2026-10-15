import { useState, useEffect, useCallback } from 'react';
import * as userApi from '../api/userApi';

const useUsers = (search = '') => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async (q = search) => {
    try {
      setLoading(true);
      setError(null);
      const res = await userApi.getUsers(q);
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};

export default useUsers;
