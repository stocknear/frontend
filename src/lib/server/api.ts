// Centralized API client for server-side fetches to the FastAPI backend.
// Handles headers, timeout, response validation, and JSON parsing.

const TIMEOUT_MS = 10_000;

/**
 * POST JSON to the backend API. Returns parsed JSON response.
 * Throws on non-2xx status or timeout.
 */
export async function postAPI(
  locals: App.Locals,
  endpoint: string,
  body?: unknown,
): Promise<any> {
  const response = await fetch(locals.apiURL + endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": locals.apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`POST ${endpoint} failed: ${response.status}`);
  }

  return response.json();
}

/**
 * GET from the backend API. Returns parsed JSON response.
 * Pass query params as part of the endpoint string, e.g. "/feed?page=1&size=50"
 */
export async function getAPI(
  locals: App.Locals,
  endpoint: string,
): Promise<any> {
  const response = await fetch(locals.apiURL + endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": locals.apiKey,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed: ${response.status}`);
  }

  return response.json();
}
