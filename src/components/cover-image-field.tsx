"use client";

import { useId, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

const MAX_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CoverImageField({
  name = "coverImageUrl",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string | null;
}) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large — 2MB max.");
      return;
    }
    setPreview(await readFileAsDataUrl(file));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Cover image (optional)</Label>
      {preview ? (
        <div className="group relative overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Form cover preview" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            aria-label="Remove cover image"
            className="absolute top-2 right-2 flex size-7 items-center justify-center bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >
          <ImagePlus className="size-5" />
          <span className="text-xs">Click to upload a banner image</span>
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input type="hidden" name={name} value={preview ?? ""} />
    </div>
  );
}
