export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-xl font-bold text-tvk-maroon-dark sm:text-2xl">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}
