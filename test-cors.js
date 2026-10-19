const url = 'https://corsproxy.io/?' + encodeURIComponent('https://exp.host/--/api/v2/push/send');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify([{
    to: 'ExponentPushToken[invalid]',
    title: 'test'
  }])
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
