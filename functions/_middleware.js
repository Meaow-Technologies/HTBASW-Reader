const WINDOW_MS = 60_000;
const MAX_TRACKED_CLIENTS = 5_000;
const NORMAL_LIMIT = 180;
const CONTENT_LIMIT = 30;
const windows = new Map();

function isContentRequest(pathname) {
  return (
    pathname.startsWith("/data/") || pathname.startsWith("/assets/downloads/")
  );
}

function clientKey(request, content) {
  const ip = request.headers.get("CF-Connecting-IP") || "anonymous";
  return `${ip}:${content ? "content" : "normal"}`;
}

function allowFallback(key, limit) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (windows.size >= MAX_TRACKED_CLIENTS) {
      for (const [storedKey, entry] of windows) {
        if (now - entry.startedAt >= WINDOW_MS) windows.delete(storedKey);
      }
    }
    windows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

function securityHeaders(content) {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": content ? "same-origin" : "same-origin",
    "X-Robots-Tag": content ? "noindex, nofollow, noarchive" : "index, follow",
  };
}

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const content = isContentRequest(url.pathname);
  const binding = content
    ? env.CONTENT_RATE_LIMITER || env.RATE_LIMITER
    : env.RATE_LIMITER;
  const key = clientKey(request, content);
  const allowed =
    binding && typeof binding.limit === "function"
      ? (await binding.limit({ key })).success
      : allowFallback(key, content ? CONTENT_LIMIT : NORMAL_LIMIT);

  if (!allowed) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: { ...securityHeaders(content), "Retry-After": "60" },
    });
  }

  const response = await next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders(content))) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (url.pathname.startsWith("/giscus/")) {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
