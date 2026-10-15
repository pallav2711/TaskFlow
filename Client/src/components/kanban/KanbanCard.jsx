import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { formatDate, isTaskOverdue } from '../../utils/helpers';

/**
 * A single draggable task card inside a Kanban column.
 */
const KanbanCard = ({ task, onEdit, onDelete, canManage = false, canChangeStatus = false }) => {
  const overdue = isTaskOverdue(task);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, disabled: !canChangeStatus });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border p-3 select-none
        ${isDragging ? 'shadow-xl ring-2 ring-indigo-400' : 'shadow-sm hover:shadow-md'}
        ${overdue ? 'border-red-200 bg-red-50/40' : 'border-gray-100'}
        transition-shadow
      `}
    >
      {/* Drag handle — entire header row is draggable */}
      <div
        {...attributes}
        {...listeners}
        className={`${canChangeStatus ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} flex items-start justify-between gap-2 mb-2`}
      >
        <p className={`text-sm font-medium leading-snug flex-1 ${overdue ? 'text-red-800' : 'text-gray-900'}`}>
          {task.title}
        </p>
        {/* Drag grip icon */}
        {canChangeStatus && (
          <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        )}
      </div>

      {/* Priority badge */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge type="priority" value={task.priority} />
        {overdue && (
          <span className="text-xs font-medium text-red-600">⚠ Overdue</span>
        )}
      </div>

      {/* Footer: project dot + due date + assignee + actions */}
      <div className="flex items-center justify-between gap-1 mt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.project?.color && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.project.color }}
              title={task.project.title}
            />
          )}
          {task.dueDate && (
            <span className={`text-xs flex-shrink-0 ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.assignee && <Avatar user={task.assignee} size="xs" />}

          {/* Inline action buttons (not part of drag handle) */}
          {canManage && <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEdit(task)}
            className="p-1 rounded text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
            aria-label="Edit task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>}
          {canManage && <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(task)}
            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
