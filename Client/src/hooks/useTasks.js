import { useState, useEffect, useCallback } from 'react';
import * as taskApi from '../api/taskApi';

const useTasks = (params = {}) => {
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify params to use as effect dependency
  const paramKey = JSON.stringify(params);

  const fetchTasks = useCallback(async (overrideParams) => {
    try {
      setLoading(true);
      setError(null);
      const res = await taskApi.getTasks(overrideParams || params);
      setTasks(res.data.data);
      setMeta({
        total: res.data.total,
        page: res.data.page,
        pages: res.data.pages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return { tasks, setTasks, meta, loading, error, refetch: fetchTasks };
};

export default useTasks;
