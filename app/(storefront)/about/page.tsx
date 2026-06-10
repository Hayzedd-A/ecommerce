import React from "react";
import getStoreSettings from "@/lib/settings.server";
import { notFound } from "next/navigation";

export default async function AboutPage() {
  const settings = await getStoreSettings();

  if (settings?.aboutUs?.showAboutUsPage === false) {
    notFound();
  }

  const { title, content } = settings?.aboutUs || {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {title || "About Us"}
          </h1>
          <div className="h-1.5 w-20 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto rounded-full" />
        </div>

        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
          {content || "Welcome to our store. We are dedicated to providing the best shopping experience for our customers."}
        </div>
      </div>
    </div>
  );
}
