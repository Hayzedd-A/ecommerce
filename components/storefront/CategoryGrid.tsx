"use client";

import { ICategory } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreSettings } from "../providers/SettingsProvider";
import { cn } from "@/lib/utils/helpers";
import { useTheme } from "next-themes";

export function CategoryGrid({ categories }: { categories: ICategory[] }) {
  const { systemTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { categoryView } = useStoreSettings();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    console.log({ resolvedTheme, systemTheme });
  }, [resolvedTheme, systemTheme]);

  return (
    <section
      id="categories"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Shop by Category
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Explore our broad range of products curated for you
          </p>
        </div>
        {/* Scroll arrows — visible on md+ */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="h-8 w-8 rounded-full border border-border bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((cat) => (
          <Link
            href={`/products?category=${cat.slug}`}
            key={cat._id}
            className={cn(
              "group shrink-0 transition-all duration-300",
              categoryView === "image"
                ? "relative w-40 h-44 rounded-2xl overflow-hidden border border-border/80 shadow-soft hover:-translate-y-1"
                : "flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-border bg-surface hover:bg-surface-secondary hover:border-primary-400 hover:text-primary-600 text-foreground whitespace-nowrap",
            )}
          >
            {/* ── Image view ── */}
            {categoryView === "image" && (
              <>
                <Image
                  src={
                    cat.image?.url ||
                    `https://placehold.co/200x220/${!isDark ? "FFFFFF" : "000000"}/${!isDark ? "000000" : "FFFFFF"}?text=${encodeURIComponent(cat.name)}`
                  }
                  alt={cat.name}
                  width={200}
                  height={300}
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-300" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                  <h3 className="font-bold text-sm tracking-wide drop-shadow leading-tight">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-primary-300 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Shop &rarr;
                  </span>
                </div>
              </>
            )}

            {/* ── Text / pill nav view ── */}
            {categoryView === "text" && (
              <>
                {/* First-letter avatar dot */}
                <span className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                  <span className="text-[11px] font-extrabold text-background dark:text-primary-400 uppercase leading-none">
                    {cat.name.charAt(0)}
                  </span>
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
              </>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
