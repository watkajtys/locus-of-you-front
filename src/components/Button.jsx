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
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out transform
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95
  `;

  const variants = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      focus:ring-blue-300
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-800
      focus:ring-gray-300
    `,
    accent: `
      text-white focus:ring-opacity-50
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 text-gray-700
      focus:ring-gray-300
    `
  };

  const sizes = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const getVariantStyles = () => {
    if (variant === 'accent') {
      return {
        backgroundColor: 'var(--color-accent)',
        color: 'white',
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