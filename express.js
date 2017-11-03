// Filename: express.js  
// Timestamp: 2017.11.03-11:47:09 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const express = require('express'),
      http = require('http'),
      port = 4343,
      app = express();

app.use('/touchboom/', express.static(__dirname + '/docs'));

http.createServer(app).listen(port);

console.log(`[...] localhost:${port}/touchboom/`);
