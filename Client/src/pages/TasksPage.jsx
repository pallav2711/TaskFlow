import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as taskApi from '../api/taskApi';
import * as projectApi from '../api/projectApi';
import useProjects from '../hooks/useProjects';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';
import Spinner from '../components/ui/Spinner';
import TaskForm from '../components/tasks/TaskForm';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import { formatDate, isTaskOverdue, debounce } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// ─── Filter bar ───────────────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, projects }) => {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Project filter */}
      <select
        value={filters.project}
        onChange={(e) => handleChange('project', e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>{p.title}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => handleChange('priority', e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Sort */}
      <select
        value={`${filters.sortBy}:${filters.order}`}
        onChange={(e) => {
          const [sortBy, order] = e.target.value.split(':');
          onChange({ ...filters, sortBy, order, page: 1 });
        }}
        className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="createdAt:desc">Newest first</option>
        <option value="createdAt:asc">Oldest first</option>
        <option value="dueDate:asc">Due date (earliest)</option>
        <option value="dueDate:desc">Due date (latest)</option>
        <option value="priority:desc">Priority (high → low)</option>
        <option value="priority:asc">Priority (low → high)</option>
      </select>

      {/* Clear filters */}
      {(filters.search || filters.project || filters.status || filters.priority) && (
        <button
          onClick={() => onChange({ search: '', project: '', status: '', priority: '', sortBy: 'createdAt', order: 'desc', page: 1 })}
          className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};

// ─── Task card ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { user } = useAuth();
  const overdue = isTaskOverdue(task);
  const canManage = user?.role === 'manager' &&
    (task.project?.owner?._id === user?._id || task.project?.owner === user?._id);
  const canUpdateStatus = user?.role === 'developer' &&
    (task.assignee?._id === user?._id || task.assignee === user?._id);

  return (
    <div
      className={`bg-white rounded-xl border transition-all hover:shadow-sm group ${
        overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-indigo-200'
      }`}
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className={`text-sm font-semibold flex-1 ${overdue ? 'text-red-800' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          <div className="flex gap-1 items-center flex-shrink-0">
            {canManage && <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              aria-label="Edit task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>}
            {canManage && (
              <button
                onClick={() => onDelete(task)}
                className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete task"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge type="status" value={task.status} />
          <Badge type="priority" value={task.priority} />
          {overdue && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              ⚠ Overdue
            </span>
          )}
        </div>

        {/* Footer: project, assignee, due date */}
        <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2 min-w-0">
            {task.project && (
              <span
                className="flex items-center gap-1 truncate"
                style={{ color: task.project.color || '#6366f1' }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: task.project.color || '#6366f1' }}
                />
                <span className="truncate">{task.project.title}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.dueDate && (
              <span className={overdue ? 'text-red-500 font-medium' : ''}>
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.assignee && <Avatar user={task.assignee} size="xs" />}
          </div>
          {canUpdateStatus && (
            <select
              aria-label={`Update status for ${task.title}`}
              value={task.status}
              onChange={(event) => onStatusChange(task, event.target.value)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
            >
              {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ page, pages, total, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
      <span>{total} tasks total</span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-2">Page {page} of {pages}</span>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search: '',
  project: '',
  status: '',
  priority: '',
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 24,
};

const TasksPage = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const ownedProjects = projects.filter((project) =>
    project.owner?._id === user?._id || project.owner === user?._id
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modals
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // project members for the create/edit form
  const [selectedProjectMembers, setSelectedProjectMembers] = useState([]);

  // debounced search
  const debouncedFetch = useRef(null);

  const fetchTasks = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      // Build clean params — remove empty strings
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)
      );
      const res = await taskApi.getTasks(clean);
      setTasks(res.data.data);
      setMeta({ total: res.data.total, page: res.data.page, pages: res.data.pages });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up debounced version once
  useEffect(() => {
    debouncedFetch.current = debounce((params) => fetchTasks(params), 350);
  }, [fetchTasks]);

  // Re-fetch on filter change
  useEffect(() => {
    debouncedFetch.current?.(filters);
  }, [filters]);

  // Load project members when a project is selected (for task form assignee dropdown)
  useEffect(() => {
    const loadMembers = async () => {
      const pid = editTarget?.project?._id || editTarget?.project || filters.project;
      if (!pid) { setSelectedProjectMembers([]); return; }
      try {
        const res = await projectApi.getProject(pid);
        const proj = res.data.data;
        setSelectedProjectMembers([proj.owner, ...(proj.members || [])]);
      } catch { setSelectedProjectMembers([]); }
    };
    loadMembers();
  }, [editTarget, filters.project]);

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const res = await taskApi.createTask(data);
      setTasks((prev) => [res.data.data, ...prev]);
      setShowCreate(false);
      toast.success('Task created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      const res = await taskApi.updateTask(editTarget._id, data);
      setTasks((prev) => prev.map((t) => (t._id === editTarget._id ? res.data.data : t)));
      setEditTarget(null);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await taskApi.deleteTask(deleteTarget._id);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally { setDeleting(false); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const res = await taskApi.updateTaskStatus(task._id, status);
      setTasks((current) => current.map((item) => item._id === task._id ? res.data.data : item));
      toast.success('Task status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const canCreateInCurrentProject = isManager &&
    (filters.project
      ? ownedProjects.some((project) => project._id === filters.project)
      : ownedProjects.length > 0);
  const activeFilterCount = [filters.search, filters.project, filters.status, filters.priority]
    .filter(Boolean).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tasks"
        subtitle={loading ? 'Loading…' : `${meta.total} task${meta.total !== 1 ? 's' : ''}${activeFilterCount > 0 ? ' (filtered)' : ''}`}
        actions={canCreateInCurrentProject ? (
          <Button
            onClick={() => setShowCreate(true)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Task
          </Button>
        ) : undefined}
      />

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} projects={projects} />

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorMessage message={error} onRetry={() => fetchTasks(filters)} />
      )}

      {/* Empty */}
      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title={activeFilterCount > 0 ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            activeFilterCount > 0
              ? 'Try adjusting your search or filter criteria.'
              : isManager
                ? 'Create your first task to get started.'
                : 'Tasks assigned to you will appear here.'
          }
          actionLabel={activeFilterCount === 0 && canCreateInCurrentProject ? 'Create Task' : undefined}
          onAction={activeFilterCount === 0 && canCreateInCurrentProject ? () => setShowCreate(true) : undefined}
        />
      )}

      {/* Task grid */}
      {!loading && !error && tasks.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
          <Pagination
            page={meta.page}
            pages={meta.pages}
            total={meta.total}
            onPage={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </>
      )}

      {/* Create modal */}
      {isManager && <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create task">
        <TaskForm
          projectId={filters.project || undefined}
          projectMembers={selectedProjectMembers}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
          showProjectSelect
          projects={ownedProjects}
        />
      </Modal>}

      {/* Edit modal */}
      {isManager && <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit task">
        <TaskForm
          initialData={editTarget}
          projectId={editTarget?.project?._id || editTarget?.project}
          projectMembers={selectedProjectMembers}
          onSubmit={handleEdit}
          onCancel={() => setEditTarget(null)}
          loading={saving}
          projects={projects}
        />
      </Modal>}

      {/* Delete confirm */}
      {isManager && <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete task?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete task"
        loading={deleting}
      />}
    </div>
  );
};

export default TasksPage;
