import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { usePasteImages } from "@/hooks/use-paste-images";

async function filesToDataUrls(
  files: File[] | FileList,
): Promise<{ ok: string[]; error: string | null }> {
  const ok: string[] = [];
  let error: string | null = null;
  for (const f of Array.from(files)) {
    if (f.size > 6 * 1024 * 1024) {
      error = `${f.name || "Pasted image"} is larger than 6MB.`;
      continue;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(f);
      });
      ok.push(data);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  return { ok, error };
}

/** Dropzone + paste target for optional screenshots. */
export function ScreenshotUploader({
  images,
  onChange,
  max = 6,
  label = "Upload a screenshot of the conversation",
  title = "Screenshots (optional)",
  titleClassName = "",
  showPasteHint = true,
  dropClassName = "",
}: {
  images: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
  title?: string;
  titleClassName?: string;
  showPasteHint?: boolean;
  dropClassName?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files) return;
      const remaining = max - images.length;
      if (remaining <= 0) return;
      const { ok, error: err } = await filesToDataUrls(Array.from(files).slice(0, remaining));
      if (err) setError(err);
      if (ok.length) onChange([...images, ...ok].slice(0, max));
    },
    [images, max, onChange],
  );

  usePasteImages((files) => void addFiles(files));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className={"text-sm font-medium " + titleClassName}>{title}</span>
        <span className="text-xs text-muted-foreground">
          {images.length}/{max}
        </span>
      </div>
      {images.length === 0 ? (
        <label
          className={
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center hover:bg-primary/10 " +
            dropClassName
          }
        >
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">{label}</span>
          {showPasteHint && (
            <span className="text-xs text-muted-foreground">
              or paste with ⌘/Ctrl+V — PNG or JPG up to 6MB
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void addFiles(e.target.files)}
          />
        </label>
      ) : (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="h-24 w-24 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < max && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:bg-accent">
              <Upload className="h-4 w-4" />
              Add
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void addFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
