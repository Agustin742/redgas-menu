"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuPromotion } from "@/features/menu/types";

type PromoCarouselProps = {
  promotions: MenuPromotion[];
};

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD_PX = 45;
const DRAG_START_PX = 6;
const VISIBLE_RANGE = 2;

const mod = (value: number, size: number) => ((value % size) + size) % size;

function getSlideStyle(offset: number) {
  const distance = Math.min(Math.abs(offset), VISIBLE_RANGE);
  const nearness = Math.min(distance, 1);
  const opacity = distance <= 1 ? 1 - 0.4 * distance : 0.6 * (VISIBLE_RANGE - distance);

  return {
    transform: `translateX(calc(-50% + ${offset * 66}%)) translateZ(${-110 * distance}px) rotateY(${-offset * 22}deg) scale(${1 - 0.14 * nearness})`,
    opacity,
    filter: `brightness(${1 - 0.2 * nearness})`,
    zIndex: Math.round((VISIBLE_RANGE - distance) * 10),
    pointerEvents: distance >= 1.5 ? ("none" as const) : ("auto" as const),
  };
}

const getStepWidth = () => Math.min(window.innerWidth * 0.66, 300) * 0.66;

export function PromoCarousel({ promotions }: PromoCarouselProps) {
  const total = promotions.length;
  const [position, setPosition] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dragStart = useRef<{ x: number; id: number } | null>(null);
  const didDrag = useRef(false);

  const go = useCallback((delta: number) => {
    setPosition((current) => current + delta);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const isPaused = isHovered || hasFocus || isDragging;

  useEffect(() => {
    if (total < 2 || reducedMotion || isPaused) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [total, reducedMotion, isPaused, go, position]);

  if (total === 0) return null;

  const activeIndex = mod(position, total);

  const goToIndex = (index: number) => {
    let delta = mod(index - activeIndex, total);
    if (delta > total / 2) delta -= total;
    go(delta);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStart.current = { x: event.clientX, id: event.pointerId };
    didDrag.current = false;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (!didDrag.current && Math.abs(dx) > DRAG_START_PX) {
      didDrag.current = true;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (didDrag.current) {
      setDragProgress(Math.max(-1, Math.min(1, dx / getStepWidth())));
    }
  };

  const endDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    commit: boolean,
  ) => {
    const start = dragStart.current;
    if (!start || start.id !== event.pointerId) return;
    dragStart.current = null;
    if (didDrag.current && commit) {
      const dx = event.clientX - start.x;
      if (dx <= -SWIPE_THRESHOLD_PX) go(1);
      else if (dx >= SWIPE_THRESHOLD_PX) go(-1);
    }
    setDragProgress(0);
    setIsDragging(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  };

  const slides = [];
  for (let offset = -VISIBLE_RANGE; offset <= VISIBLE_RANGE; offset += 1) {
    const virtualIndex = position + offset;
    const realIndex = mod(virtualIndex, total);
    const promotion = promotions[realIndex];
    const isActive = offset === 0;
    const isHidden = Math.abs(offset) >= VISIBLE_RANGE;

    slides.push(
      <div
        key={virtualIndex}
        role="group"
        aria-roledescription="diapositiva"
        aria-label={`${realIndex + 1} de ${total}`}
        aria-hidden={isHidden || undefined}
        onClick={() => {
          if (!didDrag.current && !isActive && !isHidden) go(offset);
        }}
        style={getSlideStyle(offset + dragProgress)}
        className={`absolute left-1/2 top-4 w-[min(66vw,300px)] select-none overflow-hidden rounded-2xl border border-warm-border bg-white ${
          isActive
            ? "shadow-xl ring-2 ring-coffee-yellow"
            : "cursor-pointer shadow-md"
        } ${
          isDragging || reducedMotion
            ? ""
            : "transition-[transform,opacity,filter] duration-[600ms] ease-out"
        }`}
      >
        <div className="relative aspect-[2/3] w-full bg-cream">
          <Image
            src={promotion.image}
            alt={isHidden ? "" : promotion.imageAlt}
            fill
            priority={virtualIndex === 0}
            unoptimized
            draggable={false}
            sizes="(max-width: 639px) 66vw, 300px"
            className="pointer-events-none object-cover"
          />
        </div>
      </div>,
    );
  }

  const controlClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-warm-border bg-white text-espresso transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2";

  return (
    <section
      aria-labelledby="promotions-heading"
      className="overflow-hidden border-b border-warm-border bg-cream py-6 sm:py-8"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <p className="font-accent text-sm text-energy-orange">
          Para disfrutar hoy
        </p>
        <h2
          id="promotions-heading"
          className="font-display text-2xl tracking-tight text-espresso sm:text-3xl"
        >
          Promociones
        </h2>
      </div>

      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label="Promociones de Red Gas"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={(event) => setHasFocus(event.target.matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHasFocus(false);
          }
        }}
        onPointerEnter={(event) =>
          event.pointerType === "mouse" && setIsHovered(true)
        }
        onPointerLeave={(event) =>
          event.pointerType === "mouse" && setIsHovered(false)
        }
        className="mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-espresso"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(event) => endDrag(event, true)}
          onPointerCancel={(event) => endDrag(event, false)}
          aria-live={isPaused ? "polite" : "off"}
          style={{ perspective: "1000px", touchAction: "pan-y" }}
          className="relative h-[calc(min(66vw,300px)*1.5+2rem)] w-full"
        >
          {slides}
        </div>

        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Promoción anterior"
            onClick={() => go(-1)}
            className={controlClass}
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <div className="flex items-center">
            {promotions.map((promotion, index) => (
              <button
                key={promotion.id}
                type="button"
                aria-label={`Ver promoción ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => goToIndex(index)}
                className="flex h-11 items-center justify-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso"
              >
                <span
                  className={`block h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? "w-7 bg-espresso"
                      : "w-2.5 bg-warm-border"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Promoción siguiente"
            onClick={() => go(1)}
            className={controlClass}
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    </section>
  );
}
