import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as projectApi from '../api/projectApi';
import * as taskApi from '../api/taskApi';
import * as inviteApi from '../api/inviteApi';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import EmptyState from '../components/ui/EmptyState';
import ProjectForm from '../components/projects/ProjectForm';
import TaskForm from '../components/tasks/TaskForm';
import TaskRow from '../components/tasks/TaskRow';
import { formatDate } from '../utils/helpers';

// ─── Invite status badge ───────────────────────────────────────────────────────
const InviteStatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState(null);

  // modals
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  const isOwner = project?.owner?._id === user?._id || project?.owner === user?._id;
  const isManager = user?.role === 'manager';
  const canManageProject = isManager && isOwner;

  // ── Fetch project ────────────────────────────────────────────────────────
  const fetchProject = useCallback(async () => {
    try {
      setLoadingProject(true);
      const res = await projectApi.getProject(id);
      setProject(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoadingProject(false);
    }
  }, [id]);

  // ── Fetch tasks ──────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const res = await taskApi.getTasks({ project: id, limit: 100 });
      setTasks(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load project tasks');
    }
    finally { setLoadingTasks(false); }
  }, [id]);

  // ── Fetch sent invites (manager only) ────────────────────────────────────
  const fetchInvites = useCallback(async () => {
    if (!canManageProject) return;
    try {
      const res = await inviteApi.getSentInvites(id);
      setInvites(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sent invites');
    }
  }, [id, canManageProject]);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [fetchProject, fetchTasks]);

  // fetch invites once project is loaded and we know ownership
  useEffect(() => {
    if (project && canManageProject) fetchInvites();
  }, [project, canManageProject, fetchInvites]);

  // ── Project CRUD ─────────────────────────────────────────────────────────
  const handleUpdateProject = async (data) => {
    setSaving(true);
    try {
      const res = await projectApi.updateProject(id, data);
      setProject(res.data.data);
      setShowEditProject(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally { setSaving(false); }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectApi.deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
      setDeleting(false);
    }
  };

  // ── Send invite ───────────────────────────────────────────────────────────
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    try {
      const res = await inviteApi.sendInvite(id, inviteEmail.trim());
      setInvites((prev) => [res.data.data, ...prev]);
      setInviteEmail('');
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally { setSendingInvite(false); }
  };

  // ── Cancel invite ─────────────────────────────────────────────────────────
  const handleCancelInvite = async (inviteId) => {
    try {
      await inviteApi.cancelInvite(inviteId);
      setInvites((prev) => prev.filter((i) => i._id !== inviteId));
      toast.success('Invite cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel invite');
    }
  };

  // ── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async () => {
    setDeleting(true);
    try {
      const res = await projectApi.removeMember(id, removeMemberTarget._id);
      setProject(res.data.data);
      setRemoveMemberTarget(null);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally { setDeleting(false); }
  };

  // ── Task CRUD ─────────────────────────────────────────────────────────────
  const handleCreateTask = async (data) => {
    setSaving(true);
    try {
      const res = await taskApi.createTask({ ...data, project: id });
      setTasks((prev) => [res.data.data, ...prev]);
      setShowCreateTask(false);
      toast.success('Task created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const handleEditTask = async (data) => {
    setSaving(true);
    try {
      const res = await taskApi.updateTask(editTask._id, data);
      setTasks((prev) => prev.map((t) => (t._id === editTask._id ? res.data.data : t)));
      setEditTask(null);
      toast.success('Task updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally { setSaving(false); }
  };

  const handleTaskStatusChange = async (task, status) => {
    try {
      const res = await taskApi.updateTaskStatus(task._id, status);
      setTasks((prev) => prev.map((item) => item._id === task._id ? res.data.data : item));
      toast.success('Task status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await taskApi.deleteTask(deleteTask._id);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTask._id));
      setDeleteTask(null);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    } finally { setDeleting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingProject) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={fetchProject} />;
  if (!project) return null;

  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const allMembers = [project.owner, ...(project.members || [])];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex items-center gap-1.5">
        <Link to="/projects" className="hover:text-indigo-600">Projects</Link>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{project.title}</span>
      </nav>

      {/* Project header */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: project.color || '#6366f1' }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
              {project.description && <p className="text-sm text-gray-500 mt-0.5 max-w-xl">{project.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Badge type="projectStatus" value={project.status} />
                <span className="text-xs text-gray-400">Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>
          {canManageProject && (
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setShowEditProject(true)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteProject(true)}>Delete</Button>
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{doneTasks}/{tasks.length} tasks complete</span>
              <span>{progress}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tasks + Team two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tasks list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Tasks <span className="text-gray-400 font-normal">({tasks.length})</span>
            </h2>
            {canManageProject && (
              <Button size="sm" onClick={() => setShowCreateTask(true)}
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
                Add task
              </Button>
            )}
          </div>

          {loadingTasks ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : tasks.length === 0 ? (
            <EmptyState title="No tasks yet"
              description={isManager && isOwner ? 'Add the first task to this project.' : 'No tasks assigned yet.'}
              actionLabel={isManager && isOwner ? 'Add task' : undefined}
              onAction={isManager && isOwner ? () => setShowCreateTask(true) : undefined}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {tasks.map((task) => (
                <TaskRow key={task._id} task={task}
                  onEdit={setEditTask}
                  onDelete={setDeleteTask}
                  canManage={canManageProject}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Team panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Team</h2>
            {canManageProject && (
              <Button size="sm" variant="secondary" onClick={() => setShowInviteModal(true)}>
                Invite developer
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {/* Owner */}
            <div className="flex items-center gap-3 p-3">
              <Avatar user={project.owner} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{project.owner?.name}</p>
                <p className="text-xs text-gray-400 truncate">{project.owner?.email}</p>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Manager</span>
            </div>

            {/* Members */}
            {project.members?.map((member) => (
              <div key={member._id} className="flex items-center gap-3 p-3">
                <Avatar user={member} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Dev</span>
                {canManageProject && (
                  <button onClick={() => setRemoveMemberTarget(member)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded" aria-label={`Remove ${member.name}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {project.members?.length === 0 && (
              <p className="text-sm text-gray-400 p-4 text-center">No developers added yet.</p>
            )}
          </div>

          {/* Pending invites (manager view) */}
          {canManageProject && invites.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sent Invites</h3>
              <div className="space-y-2">
                {invites.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{inv.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(inv.createdAt)}</p>
                    </div>
                    <InviteStatusBadge status={inv.status} />
                    {inv.status === 'pending' && (
                      <button onClick={() => handleCancelInvite(inv._id)}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1" title="Cancel invite">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Edit project */}
      {canManageProject && <Modal isOpen={showEditProject} onClose={() => setShowEditProject(false)} title="Edit project">
        <ProjectForm initialData={project} onSubmit={handleUpdateProject}
          onCancel={() => setShowEditProject(false)} loading={saving} />
      </Modal>}

      {/* Delete project */}
      {canManageProject && <ConfirmDialog isOpen={showDeleteProject} onClose={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProject}
        title="Delete project?"
        message={`"${project.title}" and all its tasks will be permanently deleted.`}
        confirmLabel="Delete project" loading={deleting} />}

      {/* Invite developer */}
      {canManageProject && <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteEmail(''); }}
        title="Invite a developer" size="sm">
        <p className="text-sm text-gray-500 mb-4">
          Enter the developer's email address. They will see the invite in their dashboard.
        </p>
        <form onSubmit={handleSendInvite} className="space-y-3">
          <input
            type="email"
            placeholder="developer@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowInviteModal(false)}>Cancel</Button>
            <Button type="submit" loading={sendingInvite}>Send invite</Button>
          </div>
        </form>
      </Modal>}

      {/* Remove member */}
      {canManageProject && <ConfirmDialog isOpen={!!removeMemberTarget} onClose={() => setRemoveMemberTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove member?"
        message={`Remove ${removeMemberTarget?.name} from this project?`}
        confirmLabel="Remove" loading={deleting} />}

      {/* Create task */}
      {canManageProject && <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create task">
        <TaskForm projectId={id} projectMembers={allMembers}
          onSubmit={handleCreateTask} onCancel={() => setShowCreateTask(false)} loading={saving} />
      </Modal>}

      {/* Edit task */}
      {canManageProject && <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit task">
        <TaskForm initialData={editTask} projectId={id} projectMembers={allMembers}
          onSubmit={handleEditTask} onCancel={() => setEditTask(null)} loading={saving} />
      </Modal>}

      {/* Delete task */}
      {canManageProject && <ConfirmDialog isOpen={!!deleteTask} onClose={() => setDeleteTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete task?"
        message={`"${deleteTask?.title}" will be permanently deleted.`}
        confirmLabel="Delete task" loading={deleting} />}
    </div>
  );
};

export default ProjectDetailPage;
