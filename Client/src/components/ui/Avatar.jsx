import { getInitials, stringToColor } from '../../utils/helpers';

/**
 * User avatar — shows image if available, else colored initials.
 * sizes: xs | sm | md | lg
 */
const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const Avatar = ({ user, size = 'sm', className = '' }) => {
  const name = user?.name || '';
  const initials = getInitials(name);
  const colorClass = stringToColor(name);
  const sizeClass = sizeMap[size] || sizeMap.sm;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        title={name}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      title={name}
      className={`
        rounded-full flex items-center justify-center
        text-white font-semibold flex-shrink-0
        ${colorClass} ${sizeClass} ${className}
      `}
    >
      {initials}
    </div>
  );
};

export default Avatar;
