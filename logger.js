// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: license survives though minifying?
// TODO: test browser
// TODO: check https://github.com/haadcode/logplease

// https://log4js-node.github.io/log4js-node/api.html
// https://log4js-node.github.io/log4js-node/appenders.html
// https://log4js-node.github.io/log4js-node/layouts.html

const dateFormat = require('date-format');

const log4js = require('./lib/log4js');
const layouts = require('./lib/layouts');
const LoggingEvent = require('./lib/LoggingEvent');

// https://github.com/visionmedia/debug/blob/master/src/index.js
const browser = !!(
  typeof process === 'undefined' ||
  process.type === 'renderer' ||
  process.browser === true ||
  process.__nwjs
);

// TODO: can compile even for browser?
const tty = browser ? null : require('tty');

// -----------------------------------------------------------------------------
// layout

/**
 * {
 *   "date":         "2006-01-02T03:04:05.000"
 *   "level":        "INFO",
 *   "message":      "message"
 *   "pid":          1234,
 *   "file":         "/home/wsh/qjs/log4js-node/examples/stacktrace.js"
 *   "line":         31,
 *   "function":     "func",
 *   "backtrace":    "" (for info/debug) or "(snip)" (for error/warn)
 * }
 *
 * @param {LoggingEvent} logEvent
 * @returns {Object}
 */
function j(logEvent) {
  return {
    date: dateFormat.asString(dateFormat.ISO8601_FORMAT, logEvent.startTime),
    level: logEvent.level.levelStr,
    message: logEvent.data.join(' '),
    pid: logEvent.pid,
    file: logEvent.fileName,
    line: logEvent.lineNumber,
    function: logEvent.functionName,
    backtrace: logEvent.callStack,
  };
}

// ref. https://github.com/log4js-node/log4js-node/blob/master/lib/layouts.js
function color(level) {
  switch (level) {
    case 'ERROR':
      return '\x1b[31m';
    case 'WARN':
      return '\x1b[33m';
    case 'INFO':
      return '\x1b[34m';
    case 'DEBUG':
      return '\x1b[37m';
    default:
      return '\x1b[31m';
  }
}

/**
 *                pid
 * 01-02T03:04:05 01234   foo.js:func:31 message
 * (stack trace only for error,warn)
 *
 * @param {LoggingEvent} logEvent
 * @returns {string}
 */
function c(logEvent) {
  const j_ = j(logEvent);
  const file = j_.file.substring(j_.file.lastIndexOf('/') + 1);
  // 2006-01-02T03:04:05.000
  // 01-02T03:04:05
  let s = color(j_.level);
  s += `${j_.date.slice(5,19)} ${j_.pid.toString().padStart(4, '0')} `;
  s += `${file}:${j_.function}:${j_.line.toString()} `.padStart(20, ' ');
  s += j_.message;
  s += '\x1b[39m';
  if (j_.level === 'ERROR' || j_.level === 'WARN') {
    s += `\n${j_.backtrace}`;
  }
  return s;
}

log4js.addLayout('json-layout', _config => {
  return logEvent => {
    return JSON.stringify(j(logEvent));
  };
});

log4js.addLayout('console-layout', _config => {
  return logEvent => {
    return c(logEvent);
  };
});

// -----------------------------------------------------------------------------
// configure

const confBrowser = {
  appenders: {
    'pretty-appender': {type: 'console', layout: {type: 'console-layout'}},
  },
  categories: {
    default: {
      appenders: ['pretty-appender'],
      enableCallStack: true,
      level: 'debug'
    }
  }
};

const confNode = {
  appenders: {
    'pretty-appender': {type: 'stderr', layout: {type: 'console-layout'}},
    'json-appender': {type: 'stderr', layout: {type: 'json-layout'}}
  },
  categories: {
    default: {
      appenders: [],
      enableCallStack: true,
      level: 'debug'
    }
  }
};

if (tty.isatty(process.stderr.fd) || process.env.LOG_PRETTY === '1') {
  confNode.categories.default.appenders.push('pretty-appender');
} else {
  confNode.categories.default.appenders.push('json-appender');
}

const conf = browser? confBrowser : confNode;
log4js.configure(conf);

// -----------------------------------------------------------------------------
// test

function f1() {
  f2();
}

function f2() {
  const logger = log4js.getLogger();
  logger.error('error error error error error');
  logger.warn('warn warn warn warn warn');
  logger.info('info info info info info');
  logger.debug('debug debug debug debug debug');
}

f1();
