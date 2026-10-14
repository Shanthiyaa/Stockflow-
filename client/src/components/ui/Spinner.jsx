import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' };
  return (
    <Loader2 className={`animate-spin text-navy-700 ${sizes[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="xl" />
        <p className="text-sm text-slate-500 font-medium">Loading StockFlow...</p>
      </div>
    </div>
  );
}
