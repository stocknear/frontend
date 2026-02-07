import { error, fail, redirect } from "@sveltejs/kit";
import { validateData, checkDisposableEmail, validateReturnUrl } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";
import { getMockFinancialStatement } from "$lib/server/mock";
import { mergeAllStatements } from "$lib/financials/mergeStatements";

export const load = async ({ locals, params }) => {
  const { apiKey, apiURL, user } = locals;
  const ticker = params.tickerID;

  if (locals.useMockData) {
    const income = getMockFinancialStatement(ticker, 'income-statement');
    const balance = getMockFinancialStatement(ticker, 'balance-sheet-statement');
    const cashflow = getMockFinancialStatement(ticker, 'cash-flow-statement');
    const ratios = getMockFinancialStatement(ticker, 'ratios');
    const price = getMockFinancialStatement(ticker, 'historical-price');

    const merged = mergeAllStatements(income, balance, cashflow, ratios, price);

    return {
      getMergedData: merged,
    };
  }

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

  const fetchPrice = async () => {
    const response = await fetch(apiURL + "/historical-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ ticker }),
    });
    return response.json();
  };

  const [income, balance, cashflow, ratios, price] = await Promise.all([
    fetchStatement('income-statement'),
    fetchStatement('balance-sheet-statement'),
    fetchStatement('cash-flow-statement'),
    fetchStatement('ratios'),
    fetchPrice().catch(() => ({ annual: [], quarter: [], ttm: [] })),
  ]);

  const merged = mergeAllStatements(income, balance, cashflow, ratios, price);

  return {
    getMergedData: merged,
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
