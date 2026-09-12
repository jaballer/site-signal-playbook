import { useRef, useState } from "react";

/** Copies text to the clipboard. If the clipboard is blocked, selects the neighbouring text instead. */
export default function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"Copy" | "Copied" | "Selected">("Copy");
  const button = useRef<HTMLButtonElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch {
      const target = button.current?.closest(".say")?.querySelector("p");
      if (target) {
        const range = document.createRange();
        range.selectNodeContents(target);
        getSelection()?.removeAllRanges();
        getSelection()?.addRange(range);
      }
      setStatus("Selected");
    }
    setTimeout(() => setStatus("Copy"), 1500);
  }

  return (
    <button ref={button} type="button" className="copy" onClick={copy}>
      {status}
    </button>
  );
}
