import { PRIORITY_COLORS, STATUS_COLORS, PROJECT_STATUS_COLORS } from '../../utils/constants';

/**
 * Reusable badge for priority, status, or project status.
 * type: 'priority' | 'status' | 'projectStatus' | 'custom'
 * For 'custom', pass a className directly.
 */
const Badge = ({ type = 'custom', value, className = '', dot = false }) => {
  let colorClass = className;

  if (type === 'priority') colorClass = PRIORITY_COLORS[value] || 'bg-gray-100 text-gray-600';
  else if (type === 'status') colorClass = STATUS_COLORS[value] || 'bg-gray-100 text-gray-600';
  else if (type === 'projectStatus') colorClass = PROJECT_STATUS_COLORS[value] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        rounded-full text-xs font-medium whitespace-nowrap
        ${colorClass}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0`}
        />
      )}
      {value}
    </span>
  );
};

export default Badge;
