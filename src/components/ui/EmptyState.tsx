export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-tvk-maroon/25 bg-card/60 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-tvk-yellow/20 text-xl">
        📋
      </div>
      <p className="max-w-sm text-sm text-muted">{message}</p>
    </div>
  );
}
