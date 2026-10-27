import { useCallback, useEffect, useState } from "react";
import { fetchPlatformStats, type PlatformStats } from "@/lib/statsApi";

type StatsState = {
  stats: PlatformStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function usePlatformStats(): StatsState {
  const [stats, setStats] = useState<PlatformStats | null>(null);
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
        const data = await fetchPlatformStats();
        if (active) setStats(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Platform totals are unavailable.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [nonce]);

  return { stats, loading, error, reload };
}
