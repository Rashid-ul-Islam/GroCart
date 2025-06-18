export function Button({ children, variant, className, ...props }) {
  return (
    <button className={`px-3 py-1 rounded ${variant === 'ghost' ? 'bg-transparent' : 'bg-blue-500 text-white'} ${className}`} {...props}>
      {children}
    </button>
  );
}
