import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import * as taskApi from '../api/taskApi';
import * as projectApi from '../api/projectApi';
import useProjects from '../hooks/useProjects';

import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanCard from '../components/kanban/KanbanCard';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TaskForm from '../components/tasks/TaskForm';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';

import { KANBAN_COLUMNS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const KanbanPage = () => {
  const { projects } = useProjects();
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const ownedProjects = projects.filter((project) =>
    project.owner?._id === user?._id || project.owner === user?._id
  );
  const canManageTask = (task) => isManager &&
    (task.project?.owner?._id === user?._id || task.project?.owner === user?._id);
  const canChangeStatus = (task) => canManageTask(task) ||
    (user?.role === 'developer' &&
      (task.assignee?._id === user?._id || task.assignee === user?._id));

  // ── State ────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);       // all tasks across columns
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filter by project
  const [selectedProject, setSelectedProject] = useState('');
  const canCreateInCurrentProject = isManager &&
    (selectedProject
      ? ownedProjects.some((project) => project._id === selectedProject)
      : ownedProjects.length > 0);
  // Members of selected project (for task form)
  const [projectMembers, setProjectMembers] = useState([]);

  // drag state
  const [activeTask, setActiveTask] = useState(null);  // task being dragged
  const prevStatusRef = useRef(null);                   // status before drag for rollback

  // modals
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── DnD sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // require 8px move before drag starts
    })
  );

  // ── Fetch tasks ───────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 200 };
      if (selectedProject) params.project = selectedProject;
      const res = await taskApi.getTasks(params);
      setTasks(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Load project members when project filter changes ─────────────────────
  useEffect(() => {
    if (!selectedProject) { setProjectMembers([]); return; }
    projectApi.getProject(selectedProject)
      .then((res) => {
        const proj = res.data.data;
        setProjectMembers([proj.owner, ...(proj.members || [])]);
      })
      .catch(() => setProjectMembers([]));
  }, [selectedProject]);

  // ── Group tasks by status ─────────────────────────────────────────────────
  const tasksByColumn = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  // ── Find which column a task belongs to ──────────────────────────────────
  const findColumnOfTask = (taskId) => {
    for (const col of KANBAN_COLUMNS) {
      if (tasksByColumn[col.id].some((t) => t._id === taskId)) return col.id;
    }
    return null;
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
    prevStatusRef.current = task?.status || null;
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeColumn = findColumnOfTask(activeId);
    // over.id can be a column id or another task id
    const overColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
      ? overId
      : findColumnOfTask(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Optimistically move task to the new column
    setTasks((prev) =>
      prev.map((t) => (t._id === activeId ? { ...t, status: overColumn } : t))
    );
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeColumn = findColumnOfTask(activeId);
    const overColumn = KANBAN_COLUMNS.some((c) => c.id === overId)
      ? overId
      : findColumnOfTask(overId);

    if (!activeColumn || !overColumn) return;

    // Reorder within the same column
    if (activeColumn === overColumn) {
      const colTasks = tasksByColumn[activeColumn];
      const oldIdx = colTasks.findIndex((t) => t._id === activeId);
      const newIdx = colTasks.findIndex((t) => t._id === overId);
      if (oldIdx !== newIdx && newIdx !== -1) {
        const reordered = arrayMove(colTasks, oldIdx, newIdx);
        setTasks((prev) => {
          const others = prev.filter((t) => t.status !== activeColumn);
          return [...others, ...reordered];
        });
      }
      return;
    }

    // Cross-column drop — persist to backend
    const newStatus = overColumn;
    const previousStatus = prevStatusRef.current;

    if (newStatus === previousStatus) return;

    try {
      const res = await taskApi.updateTaskStatus(activeId, newStatus);
      // Replace the task with the server response to ensure consistency
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, ...res.data.data } : t))
      );
    } catch (err) {
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t._id === activeId ? { ...t, status: previousStatus } : t))
      );
      toast.error(
        err.response?.data?.message || 'Failed to update task status. Change reverted.'
      );
    }
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Kanban Board"
        subtitle="Drag cards between columns to update their status"
        actions={
          <div className="flex items-center gap-3">
            {/* Project filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>

            {canCreateInCurrentProject && <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Task
            </Button>}
          </div>
        }
      />

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {!loading && error && <ErrorMessage message={error} onRetry={fetchTasks} />}

      {!loading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Horizontal scroll container */}
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin flex-1">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByColumn[col.id]}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                canManageTask={canManageTask}
                canChangeStatus={canChangeStatus}
              />
            ))}
          </div>

          {/* Drag overlay — renders a ghost of the card being dragged */}
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeTask ? (
              <div className="rotate-1 scale-105">
                <KanbanCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  canChangeStatus
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create task modal */}
      {isManager && <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create task">
        <TaskForm
          projectId={selectedProject || undefined}
          projectMembers={projectMembers}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={saving}
          showProjectSelect={!selectedProject}
          projects={ownedProjects}
        />
      </Modal>}

      {/* Edit task modal */}
      {isManager && <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit task">
        <TaskForm
          initialData={editTarget}
          projectId={editTarget?.project?._id || editTarget?.project}
          projectMembers={projectMembers}
          onSubmit={handleEdit}
          onCancel={() => setEditTarget(null)}
          loading={saving}
          projects={ownedProjects}
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

export default KanbanPage;
