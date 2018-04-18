const errortracky = require('./index')('123');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
app.use('/webhook', errortracky.webhookMiddleware());
app.use('/test', testMiddleware);
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(PORT, () => console.log('Test app listening on port ' + PORT + '!'));


function testMiddleware(req,res,next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    var str = `
Error: COOK ISLANDS
    at http://localhost:3001/_nuxt/pages/two/index.js:6:14
    at http://localhost:3001/_nuxt/pages/scripts/target.js:113:19
`;
    errortracky.getStackFilesSpecs(str).then(specs => {
        var result = JSON.stringify(specs, null, 2);
        console.log(result);
        res.status(200).json(specs);
    });
}
