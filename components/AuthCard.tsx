export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-amber-500 mb-3">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-stone-50 mb-2">
            {title}
          </h1>
          {subtitle && <p className="text-stone-400 text-sm">{subtitle}</p>}
        </div>

        <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-stone-400">{footer}</div>}
      </div>
    </div>
  );
}
