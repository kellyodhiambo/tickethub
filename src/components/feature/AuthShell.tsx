import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/feature/PublicLayout";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const bullets = [
  "Tickets issued only after confirmed payment",
  "Duplicate gate scans rejected automatically",
  "One verified account for buying and selling",
];

export default function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background-50 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-black lg:block">
        <img
          src="https://readdy.ai/api/search-image?query=editorial%20photograph%20of%20a%20joyful%20group%20of%20young%20Kenyans%20at%20a%20night%20concert%2C%20warm%20orange%20stage%20light%20on%20their%20faces%2C%20dark%20charcoal%20background%2C%20premium%20portrait%20photography%2C%20high%20detail%2C%20no%20text%2C%20no%20watermark&width=1200&height=1400&seq=dala-auth-side&orientation=portrait"
          alt="Friends at a Kenyan concert"
          title="Dala Tickets account"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 hero-veil" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <BrandMark tone="light" />
          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-[1.02] text-white">
              One account. Every ticket. No gate stress.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Keep your QR tickets in one wallet, get sold-out alerts on saved events and manage
              transfers without printing anything.
            </p>
            <div className="mt-6 space-y-2">
              {bullets.map((item) => (
                <p key={item} className="flex items-center gap-2 text-[11px] text-white/70">
                  <i className="ri-checkbox-circle-fill text-white" /> {item}
                </p>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">
            Nairobi · Kisumu · Mombasa · Nakuru
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10 md:px-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          {eyebrow && (
            <p className="mt-6 text-[9.5px] font-label font-bold uppercase tracking-[0.24em] text-foreground-500 lg:mt-0">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 text-2xl font-extrabold text-foreground-950">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-foreground-600">{subtitle}</p>}

          <div className="mt-5">{children}</div>

          {footer && <div className="mt-5 text-[11px] leading-relaxed text-foreground-600">{footer}</div>}

          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-background-200 pt-4 text-[10px] text-foreground-500">
            <Link to="/" className="cursor-pointer hover:text-foreground-900">
              Back to marketplace
            </Link>
            <Link to="/how-it-works" className="cursor-pointer hover:text-foreground-900">
              How it works
            </Link>
            <Link to="/organizer/support" className="cursor-pointer hover:text-foreground-900">
              Need help?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}