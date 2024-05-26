import { userRegion } from "$lib/store";


const usRegion = ['cle1','iad1','pdx1','sfo1'];

let fastifyURL = import.meta.env.VITE_EU_FASTIFY_URL;

userRegion.subscribe(value => {
  if (usRegion.includes(value)) {
    fastifyURL  = import.meta.env.VITE_USEAST_FASTIFY_URL;
  } else {
    fastifyURL  = import.meta.env.VITE_EU_FASTIFY_URL;
  }
});


export const trackPageVisit = async (path, userAgent) => {

  const postData = {
    type: 'trackPageVisit',
    path: path,
    userAgent: userAgent,
  };


  const response = await fetch(fastifyURL+'/mixpanel', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  });

}


export const trackPageDuration = async (path, userAgent, time) => {

  const postData = {
    type: 'trackPageDuration',
    path: path,
    time: time,
    userAgent: userAgent,
  };


  const response = await fetch(fastifyURL+'/mixpanel', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  });

}


export const trackPageError = async (path, userAgent, status, message) => {

  const postData = {
    type: 'trackPageError',
    path: path,
    status: status,
    message: message,
    userAgent: userAgent,
  };


  const response = await fetch(fastifyURL+'/mixpanel', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  });

}

export const trackAsset = async (symbol, assetType) => {

  const postData = {
    type: 'trackAsset',
    symbol: symbol,
    assetType: assetType,
  };


  const response = await fetch(fastifyURL+'/mixpanel', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  });

}

export const trackButtonClick = async (name) => {

  const postData = {
    type: 'trackButton',
    name: name,
  };


  const response = await fetch(fastifyURL+'/mixpanel', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  });

}