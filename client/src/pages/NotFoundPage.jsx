import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-8xl font-bold text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn btn-primary"><Home className="w-4 h-4" /> Go Home</Link>
        <button onClick={() => window.history.back()} className="btn btn-secondary"><ArrowLeft className="w-4 h-4" /> Go Back</button>
      </div>
    </div>
  );
}
