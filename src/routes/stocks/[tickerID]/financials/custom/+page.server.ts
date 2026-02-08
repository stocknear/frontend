import { error, fail, redirect } from "@sveltejs/kit";
import { validateData, checkDisposableEmail, validateReturnUrl } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";
import { mergeAllStatements } from "$lib/financials/mergeStatements";
import { PREMIUM_TIERS, limitStatements, buildLockInfo } from "$lib/financials/statementHelpers";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const ticker = params.tickerID;
  const canViewAllHistory = PREMIUM_TIERS.has(user?.tier);

  const fetchStatement = async (statement: string) => {
    const response = await fetch(apiURL + "/financial-statement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ ticker, statement }),
    });
    return response.json();
  };

  const fetchPrices = async () => {
    const response = await fetch(apiURL + "/historical-adj-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ ticker }),
    });
    return response.json();
  };

  // Fetch all 5 sources in parallel — price fetch adds no extra latency
  const [income, balance, cashflow, ratios, priceHistory] = await Promise.all([
    fetchStatement('income-statement'),
    fetchStatement('balance-sheet-statement'),
    fetchStatement('cash-flow-statement'),
    fetchStatement('ratios'),
    fetchPrices().catch(() => []),
  ]);

  const merged = mergeAllStatements(income, balance, cashflow, ratios);

  // Build date→adjClose map from raw prices (O(n) scan, only keep what we need)
  const priceMap = new Map<string, number>();
  if (Array.isArray(priceHistory)) {
    for (const p of priceHistory) {
      if (p.time && p.adjClose != null) {
        priceMap.set(p.time.split('T')[0], Number(p.adjClose));
      }
    }
  }

  // Match each merged row's date to the closest trading day price
  // Try exact date first, then look back up to 5 days (weekends/holidays)
  if (priceMap.size > 0) {
    for (const period of [merged.annual, merged.quarter, merged.ttm]) {
      for (const row of period) {
        if (!row.date) continue;
        const target = row.date.split('T')[0];
        let price: number | undefined;

        // Exact match
        price = priceMap.get(target);

        // Look back up to 5 days for weekends/holidays
        if (price === undefined) {
          const d = new Date(target);
          for (let i = 1; i <= 5; i++) {
            d.setDate(d.getDate() - 1);
            const key = d.toISOString().split('T')[0];
            price = priceMap.get(key);
            if (price !== undefined) break;
          }
        }

        if (price !== undefined && Number.isFinite(price)) {
          row.stockPrice = parseFloat(price.toFixed(2));
        }
      }
    }
  }

  // Build lock info from full data, then limit for free users
  const financialLockInfo = {
    annual: buildLockInfo(merged.annual, canViewAllHistory),
    quarterly: buildLockInfo(merged.quarter, canViewAllHistory),
    ttm: buildLockInfo(merged.ttm, canViewAllHistory),
  };

  const limitedMerged = canViewAllHistory
    ? merged
    : {
        annual: limitStatements(merged.annual, false),
        quarter: limitStatements(merged.quarter, false),
        ttm: limitStatements(merged.ttm, false),
      };

  return {
    getMergedData: limitedMerged,
    financialLockInfo,
  };
};


export const actions = {
    login: async ({ request, locals, url, cookies }) => {
        const { formData, errors } = await validateData(
            await request.formData(),
            loginUserSchema
        );

        if (errors) {
            return fail(400, {
                data: formData,
                errors: errors.fieldErrors
            });
        }

        try {
            await locals.pb.collection('users')
                .authWithPassword(formData.email, formData.password);
        } catch (err: any) {
            console.log('Error: ', err);
            throw error(err.status || 500, err.message || 'Login failed');
        }

        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/';

        cookies.delete('returnUrl', { path: '/' });

        throw redirect(302, validateReturnUrl(returnUrl, url.origin));
    },

    register: async ({ locals, request, url, cookies }) => {
        const { formData, errors } = await validateData(
            await request.formData(),
            registerUserSchema
        );

        if (errors) {
            return fail(400, {
                data: formData,
                errors: errors.fieldErrors
            });
        }

        const isEmailDisposable = await checkDisposableEmail(formData?.email);
        if (isEmailDisposable === 'true') {
            throw error(400, 'Disposable Email Addresses not allowed!');
        }

        try {
            const newUser = await locals.pb.collection('users').create(formData);
            await locals.pb.collection('users').update(newUser?.id, {
                credits: 10
            });
            await locals.pb.collection('users').requestVerification(formData.email);
            await locals.pb.collection('users')
                .authWithPassword(formData.email, formData.password);
        } catch (err: any) {
            console.log('Error: ', err);
            throw error(err.status || 500, err.message || 'Registration failed');
        }

        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/profile';

        cookies.delete('returnUrl', { path: '/' });

        throw redirect(302, validateReturnUrl(returnUrl, url.origin));
    },

      oauth2: async ({ url, locals, request, cookies }) => {

        const path = url?.href?.replace("/oauth2","")
        const authMethods = (await locals?.pb
          ?.collection("users")
          ?.listAuthMethods())?.oauth2;


        const data = await request?.formData();
        const providerSelected = data?.get("provider");

        if (!authMethods) {
          return {
            authProviderRedirect: "",
            authProviderState: "",
          };
        }
        const redirectURL = `${url.origin}/oauth`;

        const targetItem = authMethods?.providers?.findIndex(
          (item) => item?.name === providerSelected,
        );

        const provider = authMethods.providers[targetItem];
        const authProviderRedirect = `${provider.authUrl}${redirectURL}`;
        const state = provider.state;
        const verifier = provider.codeVerifier;

        cookies.set("state", state, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60,
        });

        cookies.set("verifier", verifier, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60,
        });

        cookies.set("provider", providerSelected, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60,
        });

        cookies.set("path", path, {
          httpOnly: true,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60,
        });

        redirect(302, authProviderRedirect);
      },
};
