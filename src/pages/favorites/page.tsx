import { Link } from "react-router-dom";
import PublicLayout from "@/components/feature/PublicLayout";
import { Toaster } from "@/components/feature/Toaster";
import { Button, EmptyState } from "@/components/base/ui";
import EventCard from "@/components/feature/EventCard";
import { events } from "@/mocks/events";
import { useApp } from "@/store/AppStore";

export default function FavoritesPage() {
  const { favorites } = useApp();
  const saved = events.filter((event) => favorites.includes(event.id));

  return (
    <PublicLayout>
      <div className="border-b border-background-200 bg-background-100">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-7 md:px-6 md:py-9">
          <h1 className="text-xl font-extrabold text-foreground-950 md:text-3xl">Saved events</h1>
          <p className="mt-1 max-w-xl text-[12.5px] text-foreground-600 md:mt-1.5 md:text-sm">
            Everything you bookmarked, in one place. We will warn you when a saved event is close to
            selling out.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        {saved.length === 0 ? (
          <EmptyState
            icon="ri-heart-3-line"
            title="No saved events yet"
            description="Tap the heart on any event card to keep it here for later."
            action={
              <Link to="/discover">
                <Button>Discover events</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-foreground-500">{saved.length} saved events</p>
              <Link to="/discover" className="text-[11px] font-semibold text-primary-700">
                Find more events
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              {saved.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>
      <Toaster />
    </PublicLayout>
  );
}