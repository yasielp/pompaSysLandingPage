/**
 * Real IP of the visitor.
 *
 * Behind Cloudflare set CLIENT_IP_HEADER=cf-connecting-ip: only that header is trusted
 * and anything else the visitor sends (like X-Forwarded-For) is ignored. This is only
 * safe if the server accepts traffic from Cloudflare alone (see README), otherwise
 * anyone can send that header themselves.
 *
 * Without CLIENT_IP_HEADER (local development) it falls back to X-Forwarded-For.
 */
export function getClientIp(request: Request): string {
  const trusted = process.env.CLIENT_IP_HEADER?.toLowerCase();
  if (trusted) return request.headers.get(trusted)?.trim() || "unknown";

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
