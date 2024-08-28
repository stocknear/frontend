import { error, fail, redirect } from "@sveltejs/kit";
import { validateData } from "$lib/utils";
import { loginUserSchema, registerUserSchema } from "$lib/schemas";



async function checkDisposableEmail(email) {
	const url = `https://disposable.debounce.io/?email=${encodeURIComponent(email)}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
			"Content-Type": "application/json"
			},
		});
		const output = (await response.json())?.disposable ?? false;
		return output
	}

	

export const actions = {
	
    login: async ({ request, locals }) => {
		const { formData, errors } = await validateData(
			await request.formData(),
			loginUserSchema,
		);

		if (errors) {
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors,
			});
		}

		try {
			await locals.pb
				.collection("users")
				.authWithPassword(formData.email, formData.password);
			
			/*	
			if (!locals.pb?.authStore?.model?.verified) {
				locals.pb.authStore.clear();
				return {
					notVerified: true,
				};
			}
			*/
			
		} catch (err) {
			console.log("Error: ", err);
			error(err.status, err.message);
		}


		redirect(301, '/pricing');
	},
	
    register: async ({ locals, request }) => {


		const { formData, errors } = await validateData(await request.formData(), registerUserSchema);
		if (errors) {
			return fail(400, {
				data: formData,
				errors: errors.fieldErrors
			});
		}
		const isEmailDisposable = await checkDisposableEmail(formData?.email);

		if(isEmailDisposable === "true") {
			error(400, 'Disposable Email Addresses not allowed!');
		}


		//let username = generateUsername(formData.name.split(' ').join('')).toLowerCase();

		try {
			const newUser = await locals.pb.collection('users').create(formData);
			await locals.pb?.collection('users').update(
				newUser?.id, {
					'freeTrial' : true,
					'tier': 'Pro', //Give new users a free trial for the Pro Subscription
			});

			await locals.pb.collection('users').requestVerification(formData.email);
		} catch (err) {
			console.log('Error: ', err);
			error(err.status, err.message);
		}

		try {
			await locals.pb
				.collection("users")
				.authWithPassword(formData.email, formData.password);
			
			/*
			if (!locals.pb?.authStore?.model?.verified) {
				locals.pb.authStore.clear();
				return {
					notVerified: true,
				};
			}
			*/
		} catch (err) {
			console.log("Error: ", err);
			error(err.status, err.message);
		}

		redirect(301, "/pricing");
	},
	

	
    oauth2: async ( { url, locals, request, cookies }) => {
		const authMethods = await locals?.pb?.collection('users')?.listAuthMethods();

		const data = await request?.formData();
		const providerSelected = data?.get('provider');

		if (!authMethods) {
            return {
                authProviderRedirect: '',
                authProviderState: ''
            };
        }
        const redirectURL = `${url.origin}/oauth`;
		
		const targetItem = authMethods.authProviders?.findIndex(item => item?.name === providerSelected );
		//console.log("==================")
		//console.log(authMethods.authProviders)
		//console.log('target item is: ', targetItem)

        const provider = authMethods.authProviders[targetItem];
        const authProviderRedirect = `${provider.authUrl}${redirectURL}`;
        const state = provider.state;
        const verifier = provider.codeVerifier;

		cookies.set('state', state, {httpOnly: true,
			sameSite: 'lax',
			secure: true,
			path: '/',
			maxAge: 60*60
	  	});

		cookies.set('verifier', verifier, {httpOnly: true,
			sameSite: 'lax',
			secure: true,
			path: '/',
			maxAge: 60*60
		});

		cookies.set('provider', providerSelected, {httpOnly: true,
			sameSite: 'lax',
			secure: true,
			path: '/',
			maxAge: 60*60
		});

		cookies.set('path', "/pricing", {httpOnly: true,
			sameSite: 'lax',
			secure: true,
			path: '/',
			maxAge: 60
	  	});

	

		redirect(302,authProviderRedirect);

	}
	
};
