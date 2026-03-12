type IssueWsTokenOptions = {
  locals: App.Locals;
  scope: string;
  requirePro?: boolean;
};

export async function issueWsToken({
  locals,
  scope,
  requirePro = false,
}: IssueWsTokenOptions): Promise<string | null> {
  if (!locals?.fastifyURL || !locals?.apiKey) {
    return null;
  }

  const normalizedScope = String(scope || "").trim();
  if (!normalizedScope) {
    return null;
  }

  const body: Record<string, unknown> = {
    scope: normalizedScope,
  };

  const user = locals.user as { id?: string; tier?: string } | undefined;
  if (requirePro) {
    if (user?.tier !== "Pro" || !user?.id) {
      return null;
    }
    body.userId = user.id;
    body.tier = user.tier;
  }

  try {
    const response = await fetch(locals.fastifyURL + "/generate-ws-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": locals.apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return null;
    }

    const output = await response.json();
    return typeof output?.token === "string" ? output.token : null;
  } catch (error) {
    console.error("Failed to issue WS token:", error);
    return null;
  }
}
