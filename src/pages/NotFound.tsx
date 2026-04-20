import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("404 - Not Found | CryptoLens-AI");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-[#e2e5ea] mb-2">404</p>
      <h1 className="text-lg font-semibold text-[#0f172a] mb-1">Page not found</h1>
      <p className="text-sm text-[#64748b] mb-6 max-w-[300px]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
