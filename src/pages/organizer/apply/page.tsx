import PublicLayout from "@/components/feature/PublicLayout";
import VerificationPanel from "@/pages/organizer/settings/components/VerificationPanel";

export default function OrganizerApplicationPage() {
  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-bold text-foreground-950">Apply to organize events</h1>
        <p className="mb-5 mt-2 text-sm text-foreground-600">
          Organizer tools become available after your application is approved.
        </p>
        <VerificationPanel />
      </main>
    </PublicLayout>
  );
}
