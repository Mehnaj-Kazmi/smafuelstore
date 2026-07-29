"use client";

import { useRef, useState } from "react";
import { getToken } from "@/lib/api";
import { imageSrc } from "@/components/ProductImage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Product photograph picker for the admin form.
 *
 * Uploads immediately on selection and hands the returned path back through
 * `onChange`, so by the time the product is saved `imageUrl` is just a string
 * like any other field — the save request stays plain JSON rather than needing
 * multipart handling.
 *
 * Sent with `fetch` directly rather than through the shared `api` client
 * because this is multipart: setting a JSON Content-Type here would stop the
 * browser from generating the multipart boundary and the upload would fail.
 */
export default function ImageUploadField({
  value,
  onChange,
  className = "",
  mode = "white",
  label = "Product photo",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  /**
   * `white` puts the photo on a white background, for catalogue products.
   * `cutout` removes the background entirely, for artwork placed on a
   * coloured panel such as a hero tile, where a white rectangle would read as
   * a sticker rather than as the product.
   */
  mode?: "white" | "cutout";
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function upload(file: File) {
    setError("");
    setNote("");

    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Too large — ${(file.size / 1024 / 1024).toFixed(1)}MB, limit is 5MB`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const token = getToken();
      const res = await fetch(`${API_BASE}/uploads/product-image?mode=${mode}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.message ?? `Upload failed (${res.status})`);
      }

      const { url, normalised } = (await res.json()) as { url: string; normalised?: string };
      onChange(url);
      /* Surfaced because background removal can decline an image, and silently
         leaving the old look in place is what makes it look broken. */
      if (normalised) setNote(normalised);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">{label}</label>

      <div className="flex items-center gap-4">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-2">
          {value ? (
            /* eslint-disable-next-line @next/next/no-img-element -- local upload preview */
            <img src={imageSrc(value)} alt="Product photo preview" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-[10px] leading-tight text-ink-faint">
              No photo — drawn artwork used
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
            className="block w-full text-[13px] text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-white hover:file:bg-brand-green-dark disabled:opacity-50"
          />

          <p className="mt-1.5 text-[11px] text-ink-faint">
            JPG, PNG, WebP, AVIF or GIF · up to 5MB
          </p>

          {busy && <p className="mt-1 text-[12px] font-semibold text-brand-green">Uploading…</p>}
          {note && !busy && <p className="mt-1 text-[11px] leading-4 text-ink-faint">{note}</p>}
          {error && <p className="mt-1 text-[12px] font-semibold text-sma-deal">{error}</p>}

          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="link-draw mt-1 text-[12px] font-bold text-ink-faint hover:text-white"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
