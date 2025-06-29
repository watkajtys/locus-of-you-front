const Card = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200
        transition-all duration-300 ease-in-out
        ${hover ? 'hover:shadow-lg hover:-translate-y-1' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {children}
    </div>
  );
};

export default Card;