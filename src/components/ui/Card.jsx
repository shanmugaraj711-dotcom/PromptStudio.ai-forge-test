function Card({ children, className = '', hoverEffect = true }) {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-8 shadow-sm ${
        hoverEffect ? 'hover:shadow-lg transition-shadow duration-200' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
