import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onPageChange, total, limit }) {
  if (pages <= 1) return null;

  const pageRange = [];
  const delta = 2;
  const left = Math.max(2, page - delta);
  const right = Math.min(pages - 1, page + delta);

  pageRange.push(1);
  if (left > 2) pageRange.push('...');
  for (let i = left; i <= right; i++) pageRange.push(i);
  if (right < pages - 1) pageRange.push('...');
  if (pages > 1) pageRange.push(pages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      {total !== undefined && (
        <p className="text-sm text-slate-500">
          Showing {Math.min((page - 1) * (limit || 10) + 1, total)}–{Math.min(page * (limit || 10), total)} of {total} results
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageRange.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 text-sm rounded-lg transition-colors ${
                p === page
                  ? 'bg-navy-900 text-white font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
