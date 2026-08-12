const VARIANTS = {
  primary: 'bg-tape text-floor hover:bg-tape/90 shadow-lg shadow-tape/20',
  secondary: 'bg-panel text-chalk border border-steel hover:bg-raised',
  ghost: 'text-chalk hover:bg-panel',
  danger: 'bg-danger text-chalk hover:bg-danger/90',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  );
}
