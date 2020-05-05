const log4js = require('../lib/log4js');

log4js.configure({
  "appenders": {
    "console-appender": {
      "type": "console",
      "layout": {
        "type": "pattern",
        // https://log4js-node.github.io/log4js-node/layouts.html
        // "pattern": "%[[%p]%] - %10.-100f{2} | %7.12l:%7.12o - %[%m%]"
        "pattern": "r:%[%r%] p:%[%p%] c:%[%c%] h:%[%h%] m:%[%m%] d:%[%d%] n:%[%n%] z:%[%z%] f:%[%f%] l:%[%l%] s:%[%s%]"
      }
    }
  },
  "categories": {
    "default": {
      "appenders": ["console-appender"],
      "enableCallStack": true,
      "level": "info"
    }
  }
})

// break:
// -  console.js consoleAppender

function f1() {
  f2();
}

function f2() {
  const logger = log4js.getLogger();
  logger.addContext('key0', 'val0');
  logger.addContext('key0', 'val00');
  logger.info('info');
  logger.addContext('key1', 'val1');
  logger.warn('This should not cause problems');
  logger.removeContext('key0');
  logger.error('This should not cause problems');
}

f1();

log4js.getLogger().info('This should not cause problems');
