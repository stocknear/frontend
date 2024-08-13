import PocketBase from "pocketbase";
import { serializeNonPOJOs } from '$lib/utils';

const usRegion = new Set(['cle1', 'iad1', 'pdx1', 'sfo1']);

export const handle = async ({ event, resolve }) => {
    // Use optional chaining and nullish coalescing for safer property access
    const regionHeader = event?.request?.headers?.get('x-vercel-id') ?? 'fra1::fra1::8t4xg-1700258428633-157d82fdfcc7';
    
    // Use a more compatible way to get the first element of the split array
    const userRegion = regionHeader.split('::')[0] || '';

    const isUsRegion = usRegion.has(userRegion);

    // Use a ternary operator instead of the logical OR for better compatibility
    const pbURL = isUsRegion ? import.meta.env.VITE_USEAST_POCKETBASE_URL : import.meta.env.VITE_EU_POCKETBASE_URL;
    const apiURL = isUsRegion ? import.meta.env.VITE_USEAST_API_URL : import.meta.env.VITE_EU_API_URL;
    const fastifyURL = isUsRegion ? import.meta.env.VITE_USEAST_FASTIFY_URL : import.meta.env.VITE_EU_FASTIFY_URL;
    const wsURL = isUsRegion ? import.meta.env.VITE_USEAST_WS_URL : import.meta.env.VITE_EU_WS_URL;

    event.locals = {
        region: decodeURIComponent(regionHeader),
        pb: new PocketBase(pbURL),
        apiURL,
        fastifyURL,
        wsURL,
        apiKey: import.meta.env.VITE_STOCKNEAR_API_KEY
    };

    const authCookie = event?.request?.headers?.get('cookie') || '';
    event.locals.pb.authStore.loadFromCookie(authCookie);

    if (event?.locals?.pb?.authStore?.isValid) {
        try {
            await event.locals.pb.collection('users').authRefresh();
            event.locals.user = serializeNonPOJOs(event.locals.pb.authStore.model);
        } catch (_) {
            event.locals.pb.authStore.clear();
            event.locals.user = undefined;
        }
    }

    const response = await resolve(event);

    // Use a more compatible way to set the cookie
    const cookieString = event.locals.pb.authStore.exportToCookie({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 365
    });

    response.headers.append('set-cookie', cookieString);

    return response;
};