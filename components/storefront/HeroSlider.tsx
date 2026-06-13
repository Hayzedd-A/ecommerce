"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { type EmblaOptionsType } from "embla-carousel";
import { cn } from "@/lib/utils/helpers";
import Image from "next/image";

interface HeroSliderProps {
  slides: {
    image: {
      url: string;
      publicId: string;
    };
    mainCaption?: string;
    subCaption?: string;
  }[];
}

const TWEEN_FACTOR_BASE = 0.52;

const numberWithinRange = (number: number, min: number, max: number): number =>
  Math.min(Math.max(number, min), max);

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const options: EmblaOptionsType = {
    loop: true,
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(options, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);
  const [tweenValues, setTweenValues] = useState<number[]>([]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();
    const slidesInView = emblaApi.slidesInView();
    const isScrollEvent = true;

    const styles = emblaApi.scrollSnapList().map((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[index];

      slidesInSnap.forEach((slideIndex) => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        if (engine.options.loop) {
          engine.slideLooper.loopPoints.forEach((loopPoint) => {
            const target = loopPoint.target();

            if (slideIndex === loopPoint.index && target !== 0) {
              const sign = Math.sign(target);

              if (sign === -1) {
                diffToTarget = scrollSnap - (1 + scrollProgress);
              }
              if (sign === 1) {
                diffToTarget = scrollSnap + (1 - scrollProgress);
              }
            }
          });
        }
      });

      const tweenValue = 1 - Math.abs(diffToTarget * TWEEN_FACTOR_BASE);
      return numberWithinRange(tweenValue, 0, 1);
    });
    setTweenValues(styles);
  }, [emblaApi, setTweenValues]);

  useEffect(() => {
    if (!emblaApi) return;

    onScroll();
    emblaApi.on("reInit", onScroll);
    emblaApi.on("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative w-full max-w-2xl mx-auto py-10 overflow-hidden">
      <div className="embla overflow-visible" ref={emblaRef}>
        <div className="embla__container flex items-center h-[350px] lg:h-[450px]">
          {slides.map((slide, index) => {
            const tweenValue = tweenValues[index] || 0;
            const scale = 0.6 + (tweenValue * 0.4);
            const opacity = 0.3 + (tweenValue * 0.7);
            const zIndex = Math.round(tweenValue * 10);
            const blur = 10 * (1 - tweenValue);

            return (
              <div
                key={slide.image.publicId + index}
                className="embla__slide flex-[0_0_60%] min-w-0 relative"
                style={{
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  filter: `blur(${blur}px)`,
                  transition: "all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  {/* Glow effect */}
                  <div 
                    className={cn(
                      "absolute inset-0 bg-primary-500/20 blur-3xl opacity-0 transition-opacity duration-700",
                      tweenValue > 0.9 && "opacity-100"
                    )}
                  />
                  
                  <Image
                    src={slide.image.url}
                    alt={slide.mainCaption || "Hero slide"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                  />
                  
                  {/* Caption Overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 transition-all duration-500",
                    tweenValue > 0.8 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}>
                    {slide.mainCaption && (
                      <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                        {slide.mainCaption}
                      </h3>
                    )}
                    {slide.subCaption && (
                      <p className="text-sm text-white/80 line-clamp-2">
                        {slide.subCaption}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
