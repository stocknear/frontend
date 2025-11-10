// lib/workers/test.ts

async function loadNotifications() {
  const postData = {'readed': false}
  const response = await fetch("/api/get-notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData)
  });

  const output = await response?.json() || [];
  return output;
}

onmessage = async (event: MessageEvent) => {
  const data = event.data?.message;
  let output = {}
  try {
    const [notificationList] = await Promise?.all([loadNotifications()]);
    const numberOfUnreadNotification = notificationList?.length
    const hasUnreadElement =
      numberOfUnreadNotification > 0 ? true : false;
    output = {
      notificationList,
      hasUnreadElement,
      numberOfUnreadNotification,
    };

    postMessage({ message: "success", output });
  } catch (e) {
    console.log(e)
    postMessage({ message: "error", output });
  }
  // Sending data back to the main thread
  //postMessage({ message: 'Data received in the worker', ticker, apiURL });
};

export {};
