import { error, fail, redirect } from "@sveltejs/kit";
import { validateData, checkDisposableEmail, validateReturnUrl } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";

const FREE_COLUMN_LIMIT = 5;
const PREMIUM_TIERS = new Set(["Plus", "Pro"]);

const getStatementTimestamp = (statement?: Record<string, any>) => {
  if (!statement) return 0;
  const dateValue = statement.date || statement.fiscalDate || statement.fiscalYear;
  const parsed = Date.parse(dateValue);
  if (!Number?.isNaN(parsed)) {
    return parsed;
  }
  const fiscalYear = Number(statement?.fiscalYear);
  if (Number?.isFinite(fiscalYear)) {
    return Date?.UTC(fiscalYear, 0, 1);
  }
  return 0;
};

const sortStatementsAscending = (statements: any[] = []) =>
  [...statements].sort(
    (a, b) => getStatementTimestamp(a) - getStatementTimestamp(b),
  );

const partitionStatements = (statements: any[] = [], canViewAll: boolean) => {
  if (!Array.isArray(statements)) {
    return { visible: [], locked: [] };
  }
  const chronological = sortStatementsAscending(statements);
  if (canViewAll) {
    return { visible: chronological, locked: [] };
  }
  const startIndex = Math.max(chronological.length - FREE_COLUMN_LIMIT, 0);
  return {
    visible: chronological.slice(startIndex),
    locked: chronological.slice(0, startIndex),
  };
};

const getFiscalYearValue = (statement: any) => {
  const year = Number(statement?.fiscalYear);
  return Number.isFinite(year) ? year : null;
};

const getPeriodEndingYearValue = (statement: any) => {
  const rawDate = statement?.date || statement?.fiscalDate;
  const parsed = rawDate ? Date.parse(rawDate) : Number.NaN;
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).getFullYear();
  }
  return getFiscalYearValue(statement);
};

const formatLockedRange = (
  statements: any[] = [],
  extractor: (statement: any) => number | null,
) => {
  const values = statements
    .map(extractor)
    .filter((value): value is number => Number.isFinite(value));
  if (!values.length) {
    return "";
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min}-${max}`;
};

const limitStatements = (statements: any[], canViewAll: boolean) =>
  partitionStatements(statements, canViewAll).visible;

const buildLockInfo = (statements: any[], canViewAll: boolean) => {
  const { locked } = partitionStatements(statements, canViewAll);
  return {
    hasLockedData: locked.length > 0,
    lockedFiscalYearRange: formatLockedRange(locked, getFiscalYearValue),
    lockedPeriodRange: formatLockedRange(locked, getPeriodEndingYearValue),
  };
};

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const postData = {
    ticker: params.tickerID,
    statement: 'income-statement',
  };
  const canViewAllHistory = PREMIUM_TIERS.has(user?.tier);

  const getData = async () => {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + "/financial-statement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    let output = await response.json();

    const financialLockInfo = Array.isArray(output)
      ? {
          annual: buildLockInfo(output, canViewAllHistory),
          quarterly: buildLockInfo(output, canViewAllHistory),
          ttm: buildLockInfo(output, canViewAllHistory),
        }
      : {
          annual: buildLockInfo(output?.annual, canViewAllHistory),
          quarterly: buildLockInfo(output?.quarter, canViewAllHistory),
          ttm: buildLockInfo(output?.ttm, canViewAllHistory),
        };

    if (!canViewAllHistory) {
      if (Array.isArray(output)) {
        output = limitStatements(output, false);
      } else if (output && typeof output === "object") {
        output = {
          ...output,
          annual: limitStatements(output?.annual, false),
          quarter: limitStatements(output?.quarter, false),
          ttm: limitStatements(output?.ttm, false),
        };
      }
    }

    return { output, financialLockInfo };
  };



  // Make sure to return a promise
  const { output, financialLockInfo } = await getData();

  return {
    getData: output,
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

        // Get return URL from query or cookie
        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/';

        // Remove cookie after use
        cookies.delete('returnUrl', { path: '/' });

        // Validate and redirect
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

        // Get return URL from query or cookie
        const returnUrl = url.searchParams.get('returnUrl') ||
                          cookies.get('returnUrl') ||
                          '/profile';

        // Remove cookie
        cookies.delete('returnUrl', { path: '/' });

        // Validate and redirect
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
        //console.log("==================")
        //console.log(authMethods.authProviders)
        //console.log('target item is: ', targetItem)
    
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
