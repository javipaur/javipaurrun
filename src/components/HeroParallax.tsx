"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function HeroParallax({
  imageSrc,
  imageAlt,
  children,
}: {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const top = ref.current?.getBoundingClientRect().top ?? 0;
        if (top < 0) {
          setOffset(Math.min(-top * 0.35, 220));
        } else {
          setOffset(0);
        }
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden isolate">
      <div className="absolute inset-0 -z-10">
        <div
          className="w-full h-[120%] will-change-transform"
          style={{ transform: `translateY(${offset}px)` }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-[#f6f7fb] dark:to-[#09090b]" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/30 to-transparent" />
      </div>
      {children}
    </section>
  );
}