// Filename: build.js
// Timestamp: 2017.11.03-11:51:39 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
import scroungejs from 'scroungejs'

scroungejs({
  metaurl: import.meta.url,
  version: process.env.npm_package_version,
  isbrowser: true,
  iscompress: false,
  isconcat: false,
  inputpath: './src/',
  outputpath: './docs/dist/',
  basepagein: './docs/index.tpl.html',
  basepage: './docs/index.html',
  publicpath: '/touchboom/dist',
  skippatharr: [
    'three'
    // '/three.js'
  ],
  treearr: [
    'touchboom.js',
    'touchboom_demo.js'
  ]
})
