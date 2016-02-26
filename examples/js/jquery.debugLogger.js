/**
 * DEBUG_LOGGER with optional WebSocket logging back to server
 *
 * Author: Alexander Dimitrov soul268@gmail.com
 * Date 2016-1-13
 * v 1.0.7
 *
 * USAGE:
 *
 * var
 *     log = typeof DEBUG_LOGGER === "object" ? DEBUG_LOGGER.get_logger() : {
 *         error: function (message) {
 *             alert(message);
 *         },
 *         warn: function (message) {
 *         },
 *         info: function (message) {
 *         },
 *         debug: function (message) {
 *         },
 *         trace: function (message) {
 *         },
 *         more: function (message) {
 *         }
 *     }
 *
 *     log.error("error ...");
 *     log.warn("warning ...");
 *     log.info("info ...");
 *     log.debug("debug ...");
 *     log.trace("trace ...");
 *     log.more("more ...");
 *
 */

/*jslint
 browser : true,
 unparam : true,
 indent  : 2,
 devel   : true,
 maxerr  : 50,
 nomen   : true,
 white   : true
 */
/*global $, jQuery, WebSocket*/

var DEBUG_LOGGER = (function ($) {
  "use strict";

  var
    configMap = {
      v: "1.0.7",
      d: "2016-1-13",
      remote_log: 0,
      remote_port: 3030,
      remote_connect_timeout_ms: 500,
      log_level: 1
    },
    stateMap = {
      logging_web_socket: null,
      created_web_socket: false,
      remote_log_queue: [], // store of first log messages while ws is getting ready/opening - send before first logged message after ws is ready
      browser_web_socket_support: ('WebSocket' in window || 'MozWebSocket' in window)
    };

  if (configMap.remote_log > 0) {
    createWebSocket();
  }

  function remoteLogMessage(message) {
    // WebSocket should be already created
    if (stateMap.logging_web_socket.readyState === 1) {
      while (stateMap.remote_log_queue.length > 0) {
        stateMap.logging_web_socket.send("* " + stateMap.remote_log_queue.shift());
      }
      stateMap.logging_web_socket.send(message);
    } else if (configMap.remote_log !== 0) {
      stateMap.remote_log_queue.push(message);
    }
  }

  function localLogMessage(message) {
    // second test condition - because typeof console.log is 'object' in IE9
    if (/^object$|^function$/.test(typeof console) && /^object$|^function$/.test(typeof console.log)) {
      console.log(message);
    } else {
      var $logToDiv = $('#logToDiv');
      if ($logToDiv.length === 0) {
        $logToDiv = $('<div id="logToDiv"></div>');
        $logToDiv.appendTo('body');
      }
      $('<div>' + message + '</div>').prependTo($logToDiv);
    }
  }

  function logMessage(message) {
    var ts_msg = currentTime() + message;
    if (configMap.remote_log > 0) {
      createWebSocket();
      remoteLogMessage(ts_msg);
    }

    localLogMessage(ts_msg);
  }

  function currentTime() {
    var currentdDate = new Date();
    return "("
      + currentdDate.getFullYear()
      + "-"
      + (currentdDate.getMonth() + 1)
      + "-"
      + currentdDate.getDay()
      + " "
      + currentdDate.getHours()
      + ":"
      + currentdDate.getMinutes()
      + ":"
      + currentdDate.getSeconds()
      + ") ";
  }



  function createWebSocket() {
    // preventing second call to this function to avoid multiple initializations
    if (stateMap.created_web_socket) {
      return;
    }
    stateMap.created_web_socket = true;
    if (stateMap.browser_web_socket_support === false) {
      localLogMessage("*** Browser don't have WebSocket support!");
      localLogMessage("*** Turning off remote logging!");
      configMap.remote_log = 0;
      return false;
    }

    stateMap.logging_web_socket = new WebSocket("ws://" + window.location.host + ':' + configMap.remote_port);
    setTimeout(function () {
      if (stateMap.logging_web_socket.readyState !== 1) {
        localLogMessage("WebSocket connection not ready after " + configMap.remote_connect_timeout_ms + "ms - disabling remote logging");
        configMap.remote_log = 0;
        stateMap.logging_web_socket.close();
        stateMap.remote_log_queue = [];
      } else {
        if (stateMap.remote_log_queue.length > 0) {
          remoteLogMessage("*** Flush messages on remote_connect_timeout_ms");
        }
      }
    }, configMap.remote_connect_timeout_ms);

    $(window).on('beforeunload', function () {
      stateMap.logging_web_socket.close();
    });
  }

  //------------------- BEGIN PUBLIC METHODS -------------------

  // Begin Public method /init/
  function init(cfg) {
    if (cfg !== undefined && typeof cfg === 'object') {
      if (cfg.log_level !== undefined && +cfg.log_level >= 0 && +cfg.log_level <= 9) {
        configMap.log_level = +cfg.log_level;
      }
      if (cfg.remote_log !== undefined && +cfg.remote_log >= 0) {
        configMap.remote_log = +cfg.remote_log;
      }
    }

    if (configMap.remote_log > 0) {
      createWebSocket();
    }
  }

  // End PUBLIC method /init/

  // Begin Public method /log/
  function get_logger() {
    return {
      error: function (message) {
        DEBUG_LOGGER.lastErrorMessage = message; // used by QUnit tests to check error firing
        logMessage(message);
      },
      warn: function (message) {
        if (configMap.log_level >= 1) {
          logMessage(message);
        }
      },
      info: function (message) {
        if (configMap.log_level >= 2) {
          logMessage(message);
        }
      },
      debug: function (message) {
        if (configMap.log_level >= 3) {
          logMessage(message);
        }
      },
      trace: function (message) {
        if (configMap.log_level >= 5) {
          logMessage(message);
        }
      },
      more: function (message) {
        if (configMap.log_level >= 6) {
          logMessage(message);
        }
      }
    };
  }

  // End PUBLIC method /log/

  return {
    init: init,
    get_logger: get_logger,
    lastErrorMessage: "",
    set_log_level: function (logLevel) {
      if (logLevel === undefined) {
        return configMap.log_level;
      }
      if (+logLevel >= 0 && +logLevel <= 9) {
        configMap.log_level = +logLevel;
      }
    },
    set_remote_log: function (remoteLog) {
      if (remoteLog === undefined) {
        return configMap.remote_log;
      }
      configMap.remote_log = +remoteLog;
      if (configMap.remote_log > 0) {
        createWebSocket();
      }
    }
  };

  //------------------- END PUBLIC METHODS ---------------------

}(jQuery));

DEBUG_LOGGER.init({remote_log: 0, log_level: 1});
