export default function Card({ children, className = '', as: Component = 'div', ...props }) {
  return (
    <Component
      className={`rounded-2xl border border-steel bg-panel p-5 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
