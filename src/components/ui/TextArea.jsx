function TextArea({
  label,
  value,
  onChange,
  placeholder,
  id,
  rows = 6,
  readOnly = false,
  disabled = false,
  error,
  className = '',
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        readOnly={readOnly}
        disabled={disabled}
        className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-gray-900 shadow-sm transition-colors focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
        } ${readOnly ? 'bg-gray-50' : 'bg-white'} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default TextArea;
