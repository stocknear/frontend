export type McpTokenInfo = {
  prefix: string;
  createdAt: string;
  status: "active";
};

export type McpOAuthSession = {
  sessionId: string;
  clientId: string;
  clientName: string;
  clientSource: "predefined" | "dcr" | "cimd";
  scopes: string[];
  resource: string;
  createdAt: string;
  lastRefreshedAt: string;
  expiresAt: string;
};

export type McpOAuthInfo = {
  sessions: McpOAuthSession[];
};

export type McpAccount = {
  eligible: boolean;
  token: McpTokenInfo | null;
  oauth: McpOAuthInfo | null;
};

export type McpTokenCreated = {
  token: string;
  tokenInfo: McpTokenInfo;
};
