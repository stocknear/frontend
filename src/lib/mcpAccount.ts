export type McpTokenInfo = {
  prefix: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired";
};

export type McpOAuthInfo = {
  issuer: string;
  linkedAt: string;
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
