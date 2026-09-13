import type { LinkType } from "@site-signal/playbook";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Where each kind of playbook entry lives on the site. */
export function hrefFor(type: LinkType, id: string): string {
  switch (type) {
    case "page":
      return id === "overview" ? `${base}/` : `${base}/${id}/`;
    case "question":
      return `${base}/questions/${id}/`;
    case "play":
      return `${base}/plays/${id}/`;
    case "signal":
      return `${base}/signals/${id}/`;
    case "audit":
      return `${base}/audit/${id}/`;
    case "diagnostic":
      return `${base}/diagnostics/${id}/`;
    case "phase":
      return `${base}/engagement/#phases`;
    case "layer":
      return `${base}/signals/?layer=${id}`;
    case "offer":
      return `${base}/offers/${id}/`;
    case "principle":
      return `${base}/principles/#${id}`;
    case "term":
      return `${base}/glossary/${id}/`;
  }
}

export const pad = (n: number) => String(n).padStart(2, "0");
