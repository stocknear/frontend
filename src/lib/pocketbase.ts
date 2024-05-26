import PocketBase from 'pocketbase';
import { userRegion } from '$lib/store';

const usRegion = ['cle1','iad1','pdx1','sfo1'];

let pbUrl;

  userRegion.subscribe(value => {

    if (usRegion?.includes(value)) {
      pbUrl = import.meta.env.VITE_USEAST_POCKETBASE_URL;
    } else {
      pbUrl = import.meta.env.VITE_EU_POCKETBASE_URL;
    }
  });

export const pb = new PocketBase(pbUrl); 
