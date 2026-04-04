export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} style={{ animationDelay: `${i * 75}ms` }}>
          <td className="px-6 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center justify-end gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function CaseCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4 space-y-3"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-28 animate-pulse" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}
