import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAssetUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/storage/")) {
        return `${window.location.origin}${parsed.pathname.replace("/storage/", "/storage-asset/")}`;
      }
      if (parsed.pathname.startsWith("/storage-asset/")) {
        return `${window.location.origin}${parsed.pathname}`;
      }
    } else if (url.startsWith("/storage/")) {
      return url.replace("/storage/", "/storage-asset/");
    } else if (url.startsWith("storage/")) {
      return "/" + url.replace("storage/", "storage-asset/");
    } else if (url.startsWith("/storage-asset/")) {
      return url;
    } else if (url.startsWith("storage-asset/")) {
      return "/" + url;
    }
  } catch (e) {
    console.error("Error parsing asset URL:", e);
  }
  return url;
}

