import { redirect } from '@sveltejs/kit';


export const config = {
	runtime: 'nodejs20.x',
  };

export const GET = async ({locals,  url, cookies}) => {
    //console.log(url.searchParams);
    const redirectURL = `${url.origin}/oauth`;
    //const expectedState = cookies.get('state');
    //const expectedVerifier = cookies.get('verifier');
    let newUser;

    let expectedState = cookies?.get('state');
    let expectedVerifier = cookies?.get('verifier');
    let providerSelected = cookies?.get('provider');


    const state = await url.searchParams.get('state');
    const code = await url.searchParams.get('code');

    //console.log('returned state',state)
    //console.log('returned code',code)

    //as a side effect this will generate a new code verifier, hence why we need to pass the verifier back in through the cookie
    const authMethods = await locals.pb?.collection('users')?.listAuthMethods();

    
    if (!authMethods?.authProviders) {
        console.log('No Auth Providers');
        redirect(301, '/register');
    }

    const targetItem = authMethods.authProviders.findIndex(item => item.name === providerSelected);
    const provider = authMethods.authProviders[targetItem];

    if (!provider) {
        console.log('Provider Not Found');
        redirect(301, '/register');
    }

    if (expectedState !== state) {
        console.log('Returned State Does not Match Expected', expectedState, state);
        redirect(301, '/register');
    }

    try {
        //console.log(provider)
        
        newUser = await locals.pb?.collection('users')
            .authWithOAuth2Code(provider.name, code, expectedVerifier, redirectURL);
        

        //oauthUsername = generateUsername(newUser['meta']['name'].split(' ').join('')).toLowerCase();
        
        // Check if user was created or existed already
        if(newUser?.meta?.isNew === true) {
            await locals.pb?.collection('users').update(
                newUser['record']['id'], {
                    'freeTrial' : true,
                    'tier': 'Pro', //Give new users a free trial for the Pro Subscription
                });
        }
        
        

    } catch (err) {
        console.log('Error logging in with OAuth2 user', err);
        redirect(302, "/register");

    }

    if(cookies?.get('path')) {
        redirect(301, cookies?.get('path'));
    } else {
        redirect(301,"/");
    }

    //Login user automatically

    //const avatarUrl = newUser['meta']['avatarUrl'];
    //console.log(avatarUrl);


};