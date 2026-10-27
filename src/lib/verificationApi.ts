import { supabase } from "@/lib/supabase";

export type VerificationStatus = "pending" | "approved" | "rejected";

export type VerificationRequest = {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string | null;
  phone: string | null;
  city: string | null;
  category: string | null;
  website: string | null;
  registration_number: string | null;
  reason: string | null;
  status: VerificationStatus;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VerificationProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  verified: boolean | null;
  location: string | null;
};

export type VerificationQueueItem = VerificationRequest & {
  user: VerificationProfile | null;
};

type InvokeResult<T> = { data: T | null; error: string | null };

async function invoke<T>(body: Record<string, unknown>): Promise<InvokeResult<T>> {
  const { data, error } = await supabase.functions.invoke("organizer-verification", { body });

  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const parsed = await context.json();
        if (parsed && typeof parsed.error === "string") message = parsed.error;
      } catch {
        // keep the original message
      }
    }
    return { data: null, error: message };
  }

  if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
    return { data: null, error: (data as { error: string }).error };
  }

  return { data: (data ?? null) as T | null, error: null };
}

export type SubmitPayload = {
  businessName: string;
  contactEmail: string;
  phone: string;
  city: string;
  category: string;
  website: string;
  registrationNumber: string;
  reason: string;
};

export async function fetchMyVerification() {
  return invoke<{ profile: VerificationProfile | null; request: VerificationRequest | null; isAdmin: boolean }>({
    action: "status",
  });
}

export async function submitVerification(payload: SubmitPayload) {
  return invoke<{ request: VerificationRequest; profile: VerificationProfile }>({
    action: "submit",
    ...payload,
  });
}

export async function fetchVerificationQueue() {
  return invoke<{ items: VerificationQueueItem[]; isAdmin: boolean }>({ action: "list" });
}

export async function reviewVerification(id: string, decision: "approve" | "reject", notes: string) {
  return invoke<{ ok: boolean; decision: string }>({ action: "review", id, decision, notes });
}