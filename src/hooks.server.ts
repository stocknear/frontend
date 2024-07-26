import PocketBase from "pocketbase";
import { serializeNonPOJOs } from '$lib/utils';

const usRegion = new Set(['cle1', 'iad1', 'pdx1', 'sfo1']);

export const handle = async ({ event, resolve }) => {
    const regionHeader = event?.request?.headers?.get('x-vercel-id') ?? 'fra1::fra1::8t4xg-1700258428633-157d82fdfcc7';
    const userRegion = regionHeader.split('::')[0];

    const isUsRegion = usRegion.has(userRegion);
    const pbUrl = import.meta.env[isUsRegion ? 'VITE_USEAST_POCKETBASE_URL' : 'VITE_EU_POCKETBASE_URL'];
    const apiURL = import.meta.env[isUsRegion ? 'VITE_USEAST_API_URL' : 'VITE_EU_API_URL'];
    const fastifyURL = import.meta.env[isUsRegion ? 'VITE_USEAST_FASTIFY_URL' : 'VITE_EU_FASTIFY_URL'];

    event.locals = {
        region: decodeURIComponent(regionHeader),
        pb: new PocketBase(pbUrl),
        apiURL,
        fastifyURL,
        apiKey: import.meta.env.VITE_STOCKNEAR_API_KEY
    };

    const authCookie = event?.request?.headers?.get('cookie') || '';
    event.locals.pb.authStore.loadFromCookie(authCookie);

    if (event.locals.pb.authStore.isValid) {
        try {
            await event.locals.pb.collection('users').authRefresh();
            event.locals.user = serializeNonPOJOs(event.locals.pb.authStore.model);
        } catch (_) {
            event.locals.pb.authStore.clear();
            event.locals.user = undefined;
        }
    }

    const response = await resolve(event);
    response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 365
    }));

    return response;
};