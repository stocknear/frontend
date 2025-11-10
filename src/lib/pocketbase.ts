import PocketBase from "pocketbase";

let pbUrl = import.meta.env.VITE_USEAST_POCKETBASE_URL;

export const pb = new PocketBase(pbUrl);
