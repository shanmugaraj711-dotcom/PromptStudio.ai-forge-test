function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
