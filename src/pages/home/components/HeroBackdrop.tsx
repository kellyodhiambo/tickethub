import { useEffect, useState } from "react";
import { cn } from "@/lib/helpers";

/**
 * Layered hero backdrop.
 * The base photograph is rendered by HomeHero itself (slide 1); this
 * component cross-fades two additional editorial frames over it, each
 * with its own slow cinematic drift.
 */
const slides = [
  {
    src: "https://readdy.ai/api/search-image?query=cinematic%20wide%20photograph%20of%20a%20stylish%20rooftop%20sunset%20party%20above%20the%20Nairobi%20skyline%20in%20Kenya%2C%20guests%20dancing%20with%20drinks%2C%20warm%20terracotta%20and%20amber%20light%2C%20string%20lights%20and%20light%20haze%2C%20editorial%20lifestyle%20photography%2C%20shallow%20depth%20of%20field%2C%20high%20detail%2C%20no%20text%2C%20no%20watermark&width=1600&height=900&seq=dala-hero-rooftop-02&orientation=landscape",
    alt: "Rooftop sunset party above the Nairobi skyline",
  },
  {
    src: "https://readdy.ai/api/search-image?query=cinematic%20wide%20photograph%20of%20a%20Kenyan%20cultural%20festival%20at%20golden%20hour%2C%20drummers%20and%20dancers%20in%20colourful%20traditional%20attire%2C%20large%20open%20air%20crowd%20under%20acacia%20trees%2C%20warm%20dusty%20sunlight%20and%20market%20canopies%2C%20editorial%20documentary%20photography%2C%20high%20detail%2C%20no%20text%2C%20no%20watermark&width=1600&height=900&seq=dala-hero-culture-03&orientation=landscape",
    alt: "Kenyan cultural festival performers at golden hour",
  },
];

const HOLD_MS = 7200;

export default function HeroBackdrop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % (slides.length + 1));
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          title="Dala Tickets — Kenyan concerts, festivals and live events"
          aria-hidden={active !== index + 1}
          className={cn(
            "hero-slide absolute inset-0 h-full w-full object-cover object-center",
            active === index + 1 && "is-active"
          )}
        />
      ))}
    </>
  );
}