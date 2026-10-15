import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboardApi';
import * as inviteApi from '../api/inviteApi';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import PageHeader from '../components/ui/PageHeader';
import { formatRelative, isTaskOverdue } from '../utils/helpers';
import toast from 'react-hot-toast';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sublabel }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  </div>
);

// ─── Priority Bar ─────────────────────────────────────────────────────────────
const PriorityBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
    </div>
  );
};

// ─── Project Progress Row ──────────────────────────────────────────────────────
const ProjectProgressRow = ({ project }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-3 h-3 rounded-full flex-shrink-0"
      style={{ backgroundColor: project.color || '#6366f1' }}
    />
    <span className="text-sm text-gray-700 truncate flex-1">{project.title}</span>
    <div className="w-24 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
      <div
        className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
        style={{ width: `${project.percentage}%` }}
      />
    </div>
    <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
      {project.percentage}%
    </span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invites, setInvites] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteActionId, setInviteActionId] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const fetchInvites = async () => {
    setLoadingInvites(true);
    setInviteError('');
    try {
      const res = await inviteApi.getMyInvites();
      setInvites(res.data.data);
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to load project invites');
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'developer') fetchInvites();
  }, [user?.role]);

  const respondToInvite = async (invite, action) => {
    setInviteActionId(invite._id);
    try {
      if (action === 'accept') {
        await inviteApi.acceptInvite(invite._id);
        toast.success(`You joined ${invite.project.title}`);
        await fetchStats();
      } else {
        await inviteApi.declineInvite(invite._id);
        toast.success('Invite declined');
      }
      setInvites((current) => current.filter((item) => item._id !== invite._id));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} invite`);
    } finally {
      setInviteActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchStats} />;
  }

  const { tasks, myTasks, projects, recentTasks } = stats;
  const totalTasks = tasks.total;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your projects today."
      />

      {user?.role === 'developer' && (
        <section className="bg-white rounded-xl border border-gray-100 p-5" aria-labelledby="invite-inbox-title">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="invite-inbox-title" className="text-sm font-semibold text-gray-900">
              Project invites
              {!loadingInvites && invites.length > 0 && (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                  {invites.length}
                </span>
              )}
            </h2>
            {inviteError && (
              <button type="button" onClick={fetchInvites} className="text-xs text-indigo-600 hover:underline">
                Retry
              </button>
            )}
          </div>
          {loadingInvites ? (
            <p className="text-sm text-gray-400">Loading invites…</p>
          ) : inviteError ? (
            <p role="alert" className="text-sm text-red-600">{inviteError}</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-gray-400">No pending project invites.</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{invite.project?.title || 'Project'}</p>
                    <p className="text-xs text-gray-500">
                      Invited by {invite.invitedBy?.name || invite.invitedBy?.email || 'a manager'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={inviteActionId === invite._id}
                      onClick={() => respondToInvite(invite, 'decline')}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={inviteActionId === invite._id}
                      onClick={() => respondToInvite(invite, 'accept')}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Top stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={tasks.total}
          color="bg-indigo-100"
          icon={<TaskIcon className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="To Do"
          value={tasks.byStatus['To Do']}
          color="bg-gray-100"
          icon={<CircleIcon className="w-5 h-5 text-gray-500" />}
        />
        <StatCard
          label="In Progress"
          value={tasks.byStatus['In Progress']}
          color="bg-blue-100"
          icon={<ClockIcon className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Completed"
          value={tasks.byStatus['Done']}
          color="bg-green-100"
          icon={<CheckIcon className="w-5 h-5 text-green-600" />}
          sublabel={totalTasks > 0 ? `${Math.round((tasks.byStatus['Done'] / totalTasks) * 100)}% done` : undefined}
        />
      </div>

      {/* ── Secondary row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="In Review"
          value={tasks.byStatus['In Review']}
          color="bg-purple-100"
          icon={<EyeIcon className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Overdue"
          value={tasks.overdue}
          color={tasks.overdue > 0 ? 'bg-red-100' : 'bg-gray-100'}
          icon={<AlertIcon className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          label="My Tasks"
          value={myTasks.total}
          color="bg-amber-100"
          icon={<UserIcon className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Projects"
          value={projects.total}
          color="bg-teal-100"
          icon={<FolderIcon className="w-5 h-5 text-teal-600" />}
        />
      </div>

      {/* ── Mid section ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Priority breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
          <div className="space-y-3">
            <PriorityBar label="Urgent" count={tasks.byPriority.Urgent} total={totalTasks} color="bg-red-500" />
            <PriorityBar label="High" count={tasks.byPriority.High} total={totalTasks} color="bg-orange-500" />
            <PriorityBar label="Medium" count={tasks.byPriority.Medium} total={totalTasks} color="bg-yellow-400" />
            <PriorityBar label="Low" count={tasks.byPriority.Low} total={totalTasks} color="bg-blue-400" />
          </div>
        </div>

        {/* My tasks breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">My Tasks Breakdown</h2>
          {myTasks.total === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No tasks assigned to you yet.</p>
          ) : (
            <div className="space-y-3">
              <PriorityBar label="To Do" count={myTasks.byStatus['To Do']} total={myTasks.total} color="bg-gray-400" />
              <PriorityBar label="In Prog." count={myTasks.byStatus['In Progress']} total={myTasks.total} color="bg-blue-500" />
              <PriorityBar label="Review" count={myTasks.byStatus['In Review']} total={myTasks.total} color="bg-purple-500" />
              <PriorityBar label="Done" count={myTasks.byStatus['Done']} total={myTasks.total} color="bg-green-500" />
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom section ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Project progress */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Project Progress</h2>
            <Link to="/projects" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {projects.list.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.list.slice(0, 6).map((p) => (
                <ProjectProgressRow key={p._id} project={p} />
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recently Updated</h2>
            <Link to="/tasks" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                  <div
                    key={task._id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors ${
                      overdue ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${overdue ? 'text-red-700' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge type="status" value={task.status} />
                        <Badge type="priority" value={task.priority} />
                        {overdue && (
                          <span className="text-xs text-red-500 font-medium">Overdue</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {task.assignee && <Avatar user={task.assignee} size="xs" />}
                      <span className="text-xs text-gray-400">{formatRelative(task.updatedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Greeting helper ─────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

// ─── Inline SVG icons ────────────────────────────────────────────────────────
const TaskIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const CircleIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
  </svg>
);
const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const FolderIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export default DashboardPage;
