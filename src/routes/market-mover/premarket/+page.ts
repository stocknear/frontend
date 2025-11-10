// +page.ts
import { redirect } from '@sveltejs/kit';

export function load() {
    throw redirect(302, '/market-mover/premarket/gainers');
}
