export function requestOrigin(request: Request): string {
  const headers = request.headers;
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host")?.trim() || "";
  const forwardedProto = headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .replace(/:$/, "");

  if (host) {
    let proto = forwardedProto;
    if (!proto) {
      const configured = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (configured.startsWith("https://")) proto = "https";
      else if (host.startsWith("localhost") || host.startsWith("127.")) proto = "http";
      else proto = "https";
    }
    return `${proto}://${host}`;
  }

  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
    return configured;
  }

  return new URL(request.url).origin;
}
