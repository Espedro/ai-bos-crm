"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function BusinessPickerForm({
  businesses,
}: {
  businesses: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(businesses[0]?.slug ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (slug) router.push(`/login/${slug}`);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="business">Business</Label>
        <select
          id="business"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none"
        >
          {businesses.map((business) => (
            <option key={business.slug} value={business.slug}>
              {business.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}
