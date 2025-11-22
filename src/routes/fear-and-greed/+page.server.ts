import { redirect, error } from "@sveltejs/kit";


export const load = async () => {
    redirect(303, "/market-flow");
};