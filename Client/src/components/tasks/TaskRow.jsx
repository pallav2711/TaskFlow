import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { formatDate, isTaskOverdue } from '../../utils/helpers';
import { TASK_STATUSES } from '../../utils/constants';

const TaskRow = ({ task, onEdit, onDelete, canManage = false, onStatusChange }) => {
  const { user } = useAuth();
  const overdue = isTaskOverdue(task);
  const canUpdateStatus =
    user?.role === 'developer' &&
    (task.assignee?._id === user?._id || task.assignee === user?._id);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group ${
        overdue ? 'bg-red-50/40' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${overdue ? 'text-red-700' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <Badge type="status" value={task.status} />
          <Badge type="priority" value={task.priority} />
          {task.dueDate && (
            <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {overdue ? '⚠ ' : ''}Due {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {task.assignee && <Avatar user={task.assignee} size="xs" />}

        <div className="flex gap-1 items-center">
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
          {canManage && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)} aria-label="Edit task">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task)}
              aria-label="Delete task"
              className="hover:text-red-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskRow;
