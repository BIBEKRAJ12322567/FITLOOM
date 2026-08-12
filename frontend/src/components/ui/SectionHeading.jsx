export default function SectionHeading({ eyebrow, title, subtitle, align = 'left', className = '' }) {
  return (
    <div className={`${align === 'center' ? 'text-center mx-auto' : ''} max-w-2xl ${className}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-tape">{eyebrow}</p>
      )}
      <h2 className="text-4xl leading-tight text-chalk sm:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted">{subtitle}</p>}
    </div>
  );
}
