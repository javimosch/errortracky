const glob = require("glob");
const sander = require("sander");
const sequential = require('promise-sequential');
const jsonBody = require("body/json");
const errToJSON = require('error-to-json');
const cwd = process.cwd();
const path = require('path');

const debug = require('debug')('errortracky');
const debugError = require('debug')('errortracky:error');
const console = {
  log: debug,
  error: debugError
};

var state = {
  apiKey: ''
};

module.exports = (apiKey) => {
  state.apiKey = apiKey;
  if (!state.apiKey) {
    throwError('apiKey required');
  }
  return {
    webhookMiddleware,
    getStackFilesSpecs,
    nuxtWebhookMiddleware
  };
};

function throwError(msg){
  throw new Error('errortracky: '+msg);
}

function nuxtWebhookMiddleware(){
  const express = require('express');
  const app = express();
  app.post('/', webhookMiddleware());
  return app;
}

function webhookMiddleware() {
  return function(req, res, next) {
    if (req.query.key && req.query.key.toString() == state.apiKey.toString()) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      jsonBody(req, res, send);
    }
    else {
      res.status(500).json({
        err: 'INVALID_API_KEY'
      });
    }

    function send(err, body) {
      if (!err) {
        getStackFilesSpecs(body.stack, {
          basePath: body.basePath?body.basePath:undefined
        }).then(spec => {
          let result = spec;
          res.status(200).json(result);
        }).catch(err => {
          res.status(500).json({
            err: 'ERROR',
            detail: errToJSON(err)
          });
        });

      }
      else {
        res.status(500).json({
          err: 'PARSE_ERROR'
        });
      }
    }
  };
}


async function getStackFilesSpecs(str,options = {}) {
  let specs = str.split(/\n/).map(str => {
    var line = str;
    if (str.trim().lastIndexOf('/') === -1) {
      //console.error('getStackFiles Line last /',str);
    }
    str = str.substring(str.lastIndexOf('/') + 1).replace(new RegExp(/\n/i), '');
    str = str.split(':');
    if (str.length === 3) {
      try {
        str = {
          name: str[0],
          line: parseInt(str[1]),
          col: parseInt(str[2]),
          stackPath: getIdealLineForGlobSearch(line)
        };
        return str;
      }
      catch (err) {
        //console.error('getStackFiles ParseInt',str,err);
        return null;
      }

    }
    else {
      //console.error('getStackFiles Split : no equal 3',str);
      return null;
    }
  }).filter(str => str !== null);

  return await sequential(specs.map((spec) => {
    return async() => {
      let globPath = path.join(cwd,options.basePath?(options.basePath+'/**/'):'/**/' , spec.stackPath);
      console.log('Looking for',globPath);
      spec.serverPaths = await globSearch(globPath);

      spec.files = await sequential(spec.serverPaths.map(path => {
        return async() => {
          return {
            path,
            contents: (await sander.readFile(path)).toString('utf-8')
          };
        };
      }));

      return spec;
    };
  }));

}



function globSearch(globString) {
  return new Promise((resolve, reject) => {
    glob(globString,{
      ignore:["**/node_modules/**"]
    }, function(er, files) {
      if (er) {
        return reject(er);
      }
      else {
        resolve(files);
      }
    });
  });
}

function getIdealLineForGlobSearch(line) {
  var s;
  //remove // 
  if (line.split('//').length > 1) {
    s = line.split('//')
    s.splice(0, 1)
    line = s.join('')
  }
  //move to first / 
  if (line.indexOf('/') !== -1) {
    line = line.substring(line.indexOf('/') + 1)
  }
  //remove line:col
  if (line.split(':').length > 1) {
    line = line.split(':')[0]
  }
  //left only one / (page1/index.js)
  if (line.split('/').length > 1) {
    s = line.split('/')
    if (s.length>2) {
      do{
        s.splice(0,1);
      }while(s.length>2)
    }
    line = s.join('/')
  }
  return line;
}
