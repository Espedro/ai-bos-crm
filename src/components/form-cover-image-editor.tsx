"use client";

import { useId, useState, useTransition } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { updateFormCoverImage } from "@/lib/actions/forms";

const MAX_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function FormCoverImageEditor({
  formId,
  initialUrl,
}: {
  formId: string;
  initialUrl: string | null;
}) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);
    startTransition(() => updateFormCoverImage(formId, dataUrl));
  }

  function handleRemove() {
    setPreview(null);
    startTransition(() => updateFormCoverImage(formId, null));
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="group relative overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Form cover" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove cover image"
            disabled={isPending}
            className="absolute top-2 right-2 flex size-7 items-center justify-center bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          >
            <X className="size-4" />
          </button>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-input text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="text-xs">Add a banner image</span>
            </>
          )}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={isPending}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
