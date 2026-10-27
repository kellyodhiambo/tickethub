import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/feature/PublicLayout";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-50 px-4 text-center">
      <BrandMark />
      <p className="mt-8 font-num text-6xl font-extrabold text-background-300">404</p>
      <h1 className="mt-2 text-xl font-bold text-foreground-950">This page does not exist</h1>
      <p className="mt-1 max-w-sm text-sm text-foreground-600">
        The link <span className="font-mono text-xs text-foreground-800">{location.pathname}</span> may
        be outdated, or the event was removed.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn bg-primary-500 px-5 text-sm font-semibold text-background-50 hover:bg-primary-600"
        >
          <i className="ri-home-5-line" /> Back to home
        </Link>
        <Link
          to="/discover"
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-btn border border-background-300 px-5 text-sm font-semibold text-foreground-800 hover:bg-background-100"
        >
          <i className="ri-compass-3-line" /> Browse events
        </Link>
      </div>
    </div>
  );
}
