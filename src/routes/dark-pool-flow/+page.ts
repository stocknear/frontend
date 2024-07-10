import { userRegion, getCache, setCache, isOpen } from '$lib/store';


const checkMarketHour = async () => {
  const holidays = ['2024-01-01', '2024-01-15','2024-02-19','2024-03-29','2024-05-27','2024-06-19','2024-07-04','2024-09-02','2024-11-28','2024-12-25'];
  const currentDate = new Date().toISOString().split('T')[0];

  // Get the current time in the ET time zone
  const etTimeZone = 'America/New_York';
  const currentTime = new Date().toLocaleString('en-US', { timeZone: etTimeZone });

  // Determine if the NYSE is currently open or closed
  const currentHour = new Date(currentTime).getHours();
  const isWeekendValue = new Date(currentTime).getDay() === 6 || new Date(currentTime).getDay() === 0;
  const isBeforeMarketOpenValue = currentHour < 9 || (currentHour === 9 && new Date(currentTime).getMinutes() < 30);
  const isAfterMarketCloseValue = currentHour >= 16;

  isOpen.set(!(isWeekendValue || isBeforeMarketOpenValue || isAfterMarketCloseValue || holidays?.includes(currentDate)));
}



const usRegion = ['cle1','iad1','pdx1','sfo1'];

let apiURL;

userRegion.subscribe(value => {

  if (usRegion.includes(value)) {
    apiURL = import.meta.env.VITE_USEAST_API_URL;
  } else {
    apiURL = import.meta.env.VITE_EU_API_URL;
  }
});


export const load = async ({parent}) => {
  const getDarkPoolFlow = async () => {
    let output;
    const data = await parent();

    const cachedData = getCache('', 'getDarkPoolFlow');
    if (cachedData) {
      output = cachedData;
    } else {
    // make the POST request to the endpoint
    const response = await fetch(apiURL + '/dark-pool-flow', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    output = await response.json();

    setCache('', output, 'getDarkPoolFlow');

    }

    output = data?.user?.tier !== 'Pro' ? output?.slice(0,6) : output;

    return output;
  };

  // Make sure to return a promise
  return {
    getDarkPoolFlow: await getDarkPoolFlow()
  };
};