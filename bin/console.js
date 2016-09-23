#!/usr/bin/env node
require('../console.babel'); // babel registration (runtime transpilation for node)
var path = require('path');
var rootDir = path.resolve(__dirname, '..');

global.__DEVELOPMENT__ = process.env.NODE_ENV !== 'production';

require('../console.js');
