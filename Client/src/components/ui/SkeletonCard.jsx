/**
 * Animated skeleton placeholder for loading states.
 * count: number of skeleton cards to render
 */
const SkeletonCard = ({ count = 3, className = '' }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`bg-white rounded-xl border border-gray-100 p-4 animate-pulse ${className}`}
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>
    ))}
  </>
);

export default SkeletonCard;
