## errortracky

official npm module for  https://errortracky.com

### Installation

> npm i --save errortracky
	> yarn add errortracky

### Express integration
```javascript
const errortracky = require('errortracky')('API_KEY');
const express = require('express');
const app = express();
app.use('/webhooks/errortracky',
errortracky.webhookMiddleware());
app.get('/', (req, res) => res.send('My server'));
app.listen(3000, () => {});
```
### Nuxt integration
```javascript
const errortracky = require('errortracky')('API_KEY');
module.exports = {
  serverMiddleware:[
    { 
	    path: '/webhooks/errortracky', 
	    handler: errortracky.nuxtWebhookMiddleware() 
    }
  ]
}
```


#### How it works
- errortracky will hit the webhook with a raw error stack string like : "Error: COOK ISLANDS\nat domain:3001/pages/index.vue:6:14"
- Files matching "pages/index.vue" will be sent back to errortracky.
- errortracky will be able to show stack traces smartly.

### Issues
 > You can open an issue in the github repo
- No important issues were detected so far


