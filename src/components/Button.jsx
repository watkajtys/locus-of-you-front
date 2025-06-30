const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-300 ease-in-out transform
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 active:shadow-lg
  `;

  const variants = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      focus:ring-blue-300
      hover:scale-105 hover:shadow-xl hover:-translate-y-1
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-800
      focus:ring-gray-300
      hover:scale-105 hover:shadow-xl hover:-translate-y-1
    `,
    accent: `
      bg-white border-2 shadow-lg
      hover:scale-105 hover:shadow-xl hover:-translate-y-1
      focus:ring-opacity-50
      accent-button
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 text-gray-700
      focus:ring-gray-300 hover:scale-105 hover:shadow-lg
    `
  };

  const sizes = {
    small: 'px-4 py-3 text-sm',
    medium: 'px-8 py-4 text-base',
    large: 'px-12 py-6 text-lg font-semibold'
  };

  const getVariantStyles = () => {
    if (variant === 'accent') {
      return {
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-accent)',
        color: 'var(--color-accent)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      };
    }
    return {};
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      style={getVariantStyles()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;