/**
 * Inline error block with retry option.
 */
const ErrorMessage = ({ message = 'Something went wrong.', onRetry }) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center py-12 px-4 text-center"
  >
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-sm text-red-600 font-medium mb-1">Error</p>
    <p className="text-sm text-gray-500 max-w-xs mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-sm text-indigo-600 hover:underline font-medium"
      >
        Try again
      </button>
    )}
  </div>
);

export default ErrorMessage;
