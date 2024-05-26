import { displayCompanyName, cryptoTicker, assetType} from '$lib/store';


export const load = async ({ params,  data }) => {

  cryptoTicker.update( value => params.tickerID?.toUpperCase());
  assetType.update( value => 'crypto');

  displayCompanyName.update(value => data?.companyName)

};