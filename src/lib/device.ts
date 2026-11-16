type Device = "mobile" | "desktop";

/** Rough device class from the User-Agent header; good enough for layout hints. */
export function detectDevice(userAgent: string | null): Device {
  if (!userAgent) return "desktop";
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent) ? "mobile" : "desktop";
}
