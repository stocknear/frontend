export type McpTokenInfo = {
  prefix: string;
  createdAt: string;
  status: "active";
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
