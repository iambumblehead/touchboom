// Filename: express.js  
// Timestamp: 2017.11.03-11:47:09 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import express from 'express'
import http from 'http'
import url from 'url'

const port = 4343;
const app = express();

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

app.use('/touchboom/', express.static(__dirname + '/docs'));

http.createServer(app).listen(port);

console.log(`[...] localhost:${port}/touchboom/`);
