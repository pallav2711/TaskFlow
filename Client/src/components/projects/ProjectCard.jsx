import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'manager' &&
    (project.owner?._id === user?._id || project.owner === user?._id);

  const memberCount = project.members?.length || 0;
  const taskCount = project.taskCount ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group">
      {/* Color bar */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: project.color || '#6366f1' }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/projects/${project._id}`}
              className="text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate"
            >
              {project.title}
            </Link>
            {project.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
            )}
          </div>
          <Badge type="projectStatus" value={project.status} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {taskCount} tasks
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {memberCount + 1} members
          </span>
          <span>Created {formatDate(project.createdAt)}</span>
        </div>

        {/* Member avatars */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            <Avatar user={project.owner} size="xs" className="ring-2 ring-white" />
            {project.members?.slice(0, 4).map((m) => (
              <Avatar key={m._id} user={m} size="xs" className="ring-2 ring-white" />
            ))}
            {memberCount > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{memberCount - 4}
              </div>
            )}
          </div>

          {/* Owner-only actions */}
          {isOwner && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(project)}
                aria-label="Edit project"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(project)}
                aria-label="Delete project"
                className="hover:text-red-500"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
