import { useCallback, useEffect, useState } from "react";
import { fetchEventBySlug, fetchEvents, fetchEventsPage } from "@/lib/eventsApi";
import type { EventItem } from "@/types";

type EventsState = {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useEvents(): EventsState {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchEvents();
        if (active) setEvents(rows);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load events right now.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [nonce]);

  return { events, loading, error, reload };
}

type PaginatedEventsState = EventsState & {
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
};

export function usePaginatedEvents(): PaginatedEventsState {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setEvents([]);
    setLoading(true);
    setError(null);
    setHasMore(false);
    setNextOffset(0);

    void fetchEventsPage(0)
      .then((page) => {
        if (!active) return;
        setEvents(page.events);
        setHasMore(page.hasMore);
        setNextOffset(page.nextOffset);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load events right now.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [nonce]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchEventsPage(nextOffset);
      setEvents((current) => [...current, ...page.events]);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more events right now.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextOffset]);

  return { events, loading, error, reload, hasMore, loadingMore, loadMore };
}

type EventState = {
  event: EventItem | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useEvent(slug?: string): EventState {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!slug) {
      setEvent(null);
      setLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchEventBySlug(slug);
        if (active) setEvent(row);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load this event right now.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [slug, nonce]);

  return { event, loading, error, reload };
}
