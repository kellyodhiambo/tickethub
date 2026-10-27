import { useCallback, useEffect, useState } from "react";
import { fetchEventBySlug, fetchEvents } from "@/lib/eventsApi";
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