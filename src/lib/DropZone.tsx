import { useEffect, useState } from "react";
import { useToast } from "./toast";
import { useTheme } from "./theme";
import { tt } from "./i18n";

const CSV_EXTENSIONS = new Set(["csv", "tsv", "txt"]);
const MAX_BYTES = 8 * 1024 * 1024;

function getExtension(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

/**
 * Global drag-and-drop zone for CSV files. Listens at the window level so
 * the user can drop anywhere; an overlay only renders during an active
 * drag-over. The dropped content is broadcast as a CustomEvent so any
 * surface that wants to consume it can subscribe without us touching
 * App.tsx.
 *
 *   window.addEventListener("cquant:csv-dropped", (event) => {
 *     const { name, content, bytes } = event.detail;
 *   });
 */
export function DropZone() {
  const { locale } = useTheme();
  const toast = useToast();
  const [isDragging, setDragging] = useState(false);

  useEffect(() => {
    let counter = 0;

    function onEnter(event: DragEvent) {
      if (!event.dataTransfer) return;
      // Filter purely text/url drags
      if (!Array.from(event.dataTransfer.items || []).some((item) => item.kind === "file")) {
        return;
      }
      counter += 1;
      setDragging(true);
      event.preventDefault();
    }

    function onLeave(event: DragEvent) {
      counter = Math.max(0, counter - 1);
      if (counter === 0) setDragging(false);
      event.preventDefault();
    }

    function onOver(event: DragEvent) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }

    async function onDrop(event: DragEvent) {
      event.preventDefault();
      counter = 0;
      setDragging(false);

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      const file = files[0];

      if (!CSV_EXTENSIONS.has(getExtension(file.name))) {
        toast.push({
          tone: "warning",
          title: "Unsupported file",
          description: `Expected CSV/TSV/TXT, got “${file.name}”.`
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.push({
          tone: "warning",
          title: "File too large",
          description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB; the cap is 8 MB.`
        });
        return;
      }

      try {
        const content = await file.text();
        window.dispatchEvent(
          new CustomEvent("cquant:csv-dropped", {
            detail: {
              name: file.name,
              bytes: file.size,
              content
            }
          })
        );
        toast.push({
          tone: "success",
          title: "CSV attached",
          description: `${file.name} (${file.size.toLocaleString()} bytes) is ready.`
        });
      } catch (error) {
        toast.push({
          tone: "error",
          title: "Read failed",
          description: error instanceof Error ? error.message : String(error)
        });
      }
    }

    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [toast]);

  if (!isDragging) return null;

  return (
    <div className="dropzone-overlay" role="presentation" aria-hidden="true">
      <div className="dropzone-card">
        <span className="dropzone-glyph">⤓</span>
        <p>{tt(locale, "dropzone.hint")}</p>
      </div>
    </div>
  );
}
