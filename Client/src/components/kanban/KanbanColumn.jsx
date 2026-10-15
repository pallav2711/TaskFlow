import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

/**
 * A single Kanban column. Acts as a droppable zone.
 * The SortableContext handles ordering within the column.
 */
const KanbanColumn = ({ column, tasks, onEdit, onDelete, canManageTask, canChangeStatus }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] flex-shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl border-t-2 bg-white border-x border-gray-100 ${column.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{column.label}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable task list */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[500px] p-2 space-y-2
          rounded-b-xl border border-t-0 border-gray-100
          transition-colors
          ${isOver ? 'bg-indigo-50/60 border-indigo-200' : 'bg-gray-50/50'}
        `}
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              canManage={canManageTask(task)}
              canChangeStatus={canChangeStatus(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
