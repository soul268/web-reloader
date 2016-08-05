/**
 * WEB_RELOADER
 * Library (re)loading page fragments with ajax requests
 * web.reloader.js
 * version 1.0.15
 *
 * Author: Alexander Dimitrov soul268@gmail.com
 * Date 2016-08-05
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
/*jshint latedef : false */
/*global jQuery, DEBUG_LOGGER*/

var WEB_RELOADER = (function ($) {
  'use strict';

  //---------------- BEGIN MODULE SCOPE VARIABLES --------------

  var log = typeof DEBUG_LOGGER === "object" ? DEBUG_LOGGER.get_logger() : {
    error: function (message) {
      alert(message);
    },
    warn: function (message) {
    },
    info: function (message) {
    },
    debug: function (message) {
    },
    trace: function (message) {
    },
    more: function (message) {
    }
  };

  var configMap = {
    v: "1.0.15",
    d: "2016-08-05",

    /* selector expressions */
    frameSelectorStr: '.r_frame',
    frameCommandSelectorStr: 'div.r_frame_command',
    frameLateCommandSelectorStr: 'div.r_frame_late_command',
    frameLoadClass: 'r_load_me',
    eventNamespaceSuffix: '.WEB_RELOADER',

    /*
     * links with this target frameName are skipped by WEB_RELOADER
     * e.g. data-frame='browser'
     */
    loadInWindowRegex: /^window$/,
    replaceMyselfClass: 'r_replace_myself',
    replaceMyselfSelector: null,

    /* commands */
    commands: {
      'frameReplace': function ($cmd) {
        log.trace('$$ frameReplace');
        var dstFrame = $cmd.data('frame');

        if (typeof dstFrame !== 'string' || dstFrame === '') {
          log.error('ERROR: Command frameReplace called without data-frame');
          return;
        }

        var $dstFrame = jqueryMap.$document.find('#' + dstFrame);
        if ($dstFrame.length === 0) {
          log.error("ERROR: dstFrame '" + dstFrame + "' not found in DOM");
          return;
        }

        log.more('$$ frameReplace // frame_id = ' + $dstFrame.prop('id') + ' // HTML = ' + $cmd.html());
        $dstFrame.html($cmd.html());
        setupClickAndSubmitEventListenersToContainer($dstFrame);
      },
      'loadFrame': function ($cmd) {
        log.trace('$$ loadFrame');
        var url = $cmd.data('url');
        var frameName = $cmd.data('frame');

        if (typeof url !== 'string' || url === '') {
          log.error('ERROR: Command loadFrame called without data-url');
          return;
        }

        // FIXME: tova trqbva da se sluchva i kogato A-to ima 'target': <a target=_top href=...>...</a>
        //        trqbva da poddyrjame pone _top i _blank: http://www.w3schools.com/tags/att_a_target.asp
        if (frameName && configMap.loadInWindowRegex.test(frameName)) {
          document.location = url;
          return;
        }

        var $dstFrame = findDstFrameFromTagOrParent($cmd);

        if (typeof $dstFrame !== 'object') {
          log.error('ERROR: Unable to find destination frame');
          return;
        }

        log.more('$$ loadFrame // dstFrame id = ' + $dstFrame.prop('id') + ' // URL = ' + url);


        $dstFrame.data('url', url);
        $dstFrame.addClass(configMap.frameLoadClass);
      },
      'reloadFrame': function ($cmd) {
        log.trace('$$ reloadFrame');

        var frameName = $cmd.data('frame');

        var $dstFrame = findDstFrameFromTagOrParent($cmd);

        if (typeof $dstFrame !== 'object') {
          log.error('ERROR: Unable to find destination frame');
          return;
        }

        var url = $dstFrame.data('url');

        if (typeof url !== 'string' || url === '') {
          log.error('ERROR: Command reloadFrame called on frame without data-url');
          return;
        }

        if (frameName && configMap.loadInWindowRegex.test(frameName)) {
          document.location = url;
          return;
        }

        log.more('$$ reloadFrame // dstFrame id = ' + $dstFrame.prop('id') + ' // URL = ' + url);

        $dstFrame.addClass(configMap.frameLoadClass);
      },
      'execGroup': function ($cmd) {
        log.trace('$$ execGroup');
        var lateGroupName = $cmd.data('value');

        executeLateCommands(lateGroupName);
      },
      'execJS': function ($cmd) {
        log.trace('$$ execJS');
        var fn = $cmd.data('function');
        log.trace('$$ execJS function=[' + fn + ']');
        window[fn]();
      }
    } // end commands
  }; // end configMap
  configMap.frameLoadSelectorStr = '.' + configMap.frameLoadClass;
  configMap.replaceMyselfSelector = '.' + configMap.replaceMyselfClass;

  var stateMap = {
    loaderPass: 0,
    inputFormAttributeSupport: null,
    logging_web_socket: null,
    remote_log_queue: []
  };

  var jqueryMap = {};

  //----------------- END MODULE SCOPE VARIABLES ---------------


  //------------------- BEGIN UTILITY METHODS ------------------

  function setJqueryMap() {
    jqueryMap = {
      $document: $(document)
    };
  }

  function loaderPassAsStr() {
    return '[' + stateMap.loaderPass + '] ';
  }

  function lookupDstFrameA($a) {
    log.trace('::lookupDstFrameA $a => ' + $a[0].tagName + '#' + $a.prop('id'));

    var $frame;

    // 1. look for id in data-frame on $a
    var frameId = $a.data('frame');
    if (frameId) {
      log.more('::lookupDstFrameA found frameId on srcTag / frameId=[' + frameId + ']');

      if (configMap.loadInWindowRegex.test(frameId)) {
        // shouldn't(excluded by regex) be resolved
        log.more('::lookupDstFrameA frameId excluded by loadInWindowRegex - SKIP PROCESSING!');
        return null;
      }

      $frame = $('#' + frameId).filter(configMap.frameSelectorStr);
      if ($frame.length !== 1) {
        log.error("ERROR: cant find frame with id=" + frameId);
      } else {
        return $frame;
      }
    }

    // 2. find a frame containing $a
    var skipFrame = +$a.data('skip-frame');
    if (skipFrame > 0) {
      log.more('::lookupDstFrameA found skip-frame! value=' + skipFrame);
      var $parents = $a.parents(configMap.frameSelectorStr); // parent frames
      log.more('::lookupDstFrameA parents.length=' + $parents.length);
      if (skipFrame < $parents.length) {
        $frame = $parents.eq(skipFrame);
        return $frame;
      }
      log.more('::lookupDstFrameA skipFrame is more then parent frames - result: frame not found');
    } else {
      $frame = $a.closest(configMap.frameSelectorStr);
      if ($frame.length === 1) {
        log.more('::lookupDstFrameA found containing frame');
        return $frame;
      }
    }

    return null;
  }

  function lookupDstFrameInfo($srcTag) {
    log.trace('::lookupDstFrameInfo $srcTag => ' + $srcTag[0].tagName + '#' + $srcTag.prop('id'));

    // 1. look for frameId on srcTag
    var frameId = $srcTag.data('frame');
    if (frameId) {
      log.more('::lookupDstFrameInfo found frameId on srcTag / frameId=[' + frameId + ']');
    }

    // 2. look for frameId on frame containing srcTag
    if (typeof frameId !== 'string' || frameId === '') {
      frameId = $srcTag.closest(configMap.frameSelectorStr).prop('id');
      if (frameId) {
        log.more('::lookupDstFrameInfo found on parent frame / frameId=[' + frameId + ']');
      }
    }

    // 3. return skipProcessingLink=true if not found (negative answer)
    if (typeof frameId !== 'string' || frameId === '') {
      //frameId not found
      log.more('::lookupDstFrameInfo frameId NOT FOUND');
      return {frameId: undefined, skipProcessingLink: true};
    }

    // 4. check if frameId has to be skipped (negative answer)
    if (configMap.loadInWindowRegex.test(frameId)) {
      // shouldn't(excluded by regex) be resolved
      log.more('::lookupDstFrameInfo frameId excluded by loadInWindowRegex - SKIP PROCESSING!');
      return {frameId: frameId, skipProcessingLink: true};
    }

    // 5. positive answer
    return {frameId: frameId, skipProcessingLink: false};
  }

  function findDstFrameFromTagOrParent($tag) {
    log.trace('::findDstFrameFromTagOrParent tagName=[' + $tag[0].tagName + ']');

    var $frame = $tag.closest(configMap.frameSelectorStr); // frame containing $tag

    var frameId = $tag.data('frame'); // if from data-frame on tag
    if (typeof frameId === 'string' && frameId !== '') {
      log.more('::findDstFrameFromTagOrParent frameId=[' + frameId + ']');
      var $f = jqueryMap.$document.find('#' + frameId);
      if ($f.length === 0) {
        log.error('ERROR: Frame not found! id=' + frameId);
      } else {
        $frame = $f;
      }
    }

    return $frame;
  }

  function callOnLoadFunction(funcName, $frame) {
    log.trace('::callOnLoadFunction // funcName=[' + funcName + ']');
    if (WEB_RELOADER.onload[funcName] && typeof WEB_RELOADER.onload[funcName] === 'function') {
      log.more('::callOnLoadFunction // EXEC ' + funcName + '(' + $frame[0].tagName + '#' + $frame.prop('id') + ')');
      WEB_RELOADER.onload[funcName]($frame);
    } else {
      log.error('ERROR: calling r_frame onload function [' + funcName + '] failed! (undefined or not a function)');
    }
  }

  function callOnErrorFunction(funcName, $frame, errMsg) {
    log.trace('::callOnErrorFunction // funcName=[' + funcName + ']');
    if (WEB_RELOADER.onerror[funcName] && typeof WEB_RELOADER.onerror[funcName] === 'function') {
      log.more('::callOnErrorFunction // EXEC ' + funcName + '(' + $frame[0].tagName + '#' + $frame.prop('id') + ')');
      WEB_RELOADER.onerror[funcName]($frame, errMsg);
    } else {
      log.error('ERROR: calling r_frame onerror function [' + funcName + '] failed! (undefined or not a function)');
    }
  }

  function callAllGlobalOnLoadFunctions($frame) {
    log.trace('::callAllGlobalOnLoadFunctions');
    var func_name;

    for (func_name in WEB_RELOADER.global_onload) {
      if (WEB_RELOADER.global_onload.hasOwnProperty(func_name)) {
        if (typeof func_name !== 'string') {
          log.error('::callAllGlobalOnLoadFunctions func_name is not a string');
          continue;
        }
        if (typeof WEB_RELOADER.global_onload[func_name] !== 'function') {
          log.error('::callAllGlobalOnLoadFunctions WEB_RELOADER.global_onload[func_name] is not a function');
          continue;
        }
        log.more('::callAllGlobalOnLoadFunctions CALL GLOBAL ONLOAD FUNCTION func_name=[' + func_name + ']');
        WEB_RELOADER.global_onload[func_name]($frame);
      }
    }
  }

  function callAllGlobalOnErrorFunctions($frame, errMsg) {
    log.trace('::callAllGlobalOnErrorFunctions');
    var func_name;

    for (func_name in WEB_RELOADER.global_onerror) {
      if (WEB_RELOADER.global_onerror.hasOwnProperty(func_name)) {
        if (typeof func_name !== 'string') {
          log.error('::callAllGlobalOnErrorFunctions func_name is not a string');
          continue;
        }
        if (typeof WEB_RELOADER.global_onerror[func_name] !== 'function') {
          log.error('::callAllGlobalOnErrorFunctions WEB_RELOADER.global_onerror[' + func_name + '] is not a function');
          continue;
        }
        log.more('::callAllGlobalOnErrorFunctions CALL GLOBAL ONERROR FUNCTION func_name=[' + func_name + ']');
        WEB_RELOADER.global_onerror[func_name]($frame, errMsg);
      }
    }
  }

  function addHiddenButtonNameIfMissing($form, buttonNameStr) {
    log.trace('::addHiddenButtonNameIfMissing $form.length=[' + $form.length + '] buttonNameStr=[' + buttonNameStr + ']');
    var $buttonName;
    if (typeof $form.formId === 'string') {
      log.more('::addHiddenButtonNameIfMissing HTML5 FORM');
      $buttonName = $('input[type="hidden"][form="' + $form.formId + '"][name="_button_name"]');
    } else {
      log.more('::addHiddenButtonNameIfMissing CLASSIC FORM');
      $buttonName = $form.find('input[type="hidden"][name="_button_name"]');
    }
    if ($buttonName.length === 0) {
      log.more('_button_name not found! creating new...');
      $buttonName = $("<input type='hidden' name='_button_name' value=''" + ($form.formId ? " form='" + $form.formId + "'" : "") + ">");
      $form.append($buttonName);
    }
    $buttonName.val(buttonNameStr);
  }

  function findFormFromButton($submit) {
    log.trace('::findFormFromButton $submit.tagName=[' + $submit[0].tagName + ']');

    var $form;
    var formId = $submit.attr('form');

    if (formId && typeof formId === 'string') {
      /* html5 forms - inputs can be anywhere on page and have form='form_id' attr - searching for form using id in attr */
      log.more('::findFormFromButton html5-style form support enabled for form with ID=[' + formId + ']');
      $form = $('#' + formId);
      if ($form.length !== 1) {
        log.error('ERROR: form not found! (html5) ID=[' + formId + ']');
        return false;
      }
      $form.formId = formId; // piggyback formId as prop on jQuery object
    } else {
      /* classic forms - searching for closest parent form tag */
      $form = $submit.closest('form');
      if ($form.length !== 1) {
        log.error('ERROR: form not found! (classic)');
        return false;
      }
    }

    return $form;
  }

  /*
   * returns false in IE
   */
  function testInputFormAttributeSupport() {

    var createElement = function () {
      if (typeof document.createElement !== 'function') {
        // This is the case in IE7, where the type of createElement is "object".
        // For this reason, we cannot call apply() as Object is not a Function.
        return document.createElement(arguments[0]);
      } else {
        return document.createElement.apply(document, arguments);
      }
    };

    var form = createElement('form');
    var input = createElement('input');
    var div = createElement('div');
    var id = 'formtest' + (new Date()).getTime();
    var attr;

    form.id = id;

    try {
      input.setAttribute('form', id);
    }
    catch (e) {
      if (document.createAttribute) {
        attr = document.createAttribute('form');
        attr.nodeValue = id;
        input.setAttributeNode(attr);
      }
    }

    div.appendChild(form);
    div.appendChild(input);

    var docElement = document.documentElement;
    docElement.appendChild(div);

    var bool = form.elements.length === 1 && input.form === form;

    div.parentNode.removeChild(div);
    return bool;
  }

  function doSubmitForm($form, $overlayDiv) {
    log.trace('::doSubmitForm form.id=[' + $form.prop('id') + ']');

    var formId = $form.prop('id');
    var $controls = $form.find(':input');

    var lookupDstInfo = lookupDstFrameInfo($form);
    if (lookupDstInfo.skipProcessingLink) {
      log.more('[DO REGULAR SUBMIT]');
      $form.submit();
      return true;
    }

    log.more('[DO AJAX SUBMIT]');

    $controls = $controls.add($(':input[form=' + formId + ']'));
    var $dstFrame = $('#' + lookupDstInfo.frameId);
    var onLoad = $dstFrame.data('onload');
    var onError = $dstFrame.data('onerror');
    var data = $controls.serialize();
    log.more('::doSubmitForm data=[' + data + ']');
    var url = $form.prop('action') || '.';

    function ajaxOk(data) {
      postProcessAjaxDataThenAddToDom($dstFrame, data);
      if (onLoad) {
        callOnLoadFunction(onLoad, $dstFrame);
      }
      callAllGlobalOnLoadFunctions($dstFrame);
      if ($overlayDiv[0]) {
        $overlayDiv[0].style.display = 'none'; //TODO: move to onLoad function
      }
    }

    function ajaxError(jqXHR, textStatus, errorThrown) {
      log.error('ERROR: ajaxError ( jqXHR = ' + jqXHR + ' / errorThrown = ' + errorThrown + ')');
      if (onError) {
        callOnErrorFunction(onError, $dstFrame, 'ERROR: ' + errorThrown);
      }
      callAllGlobalOnErrorFunctions($dstFrame, 'ERROR: ' + errorThrown);
    }

    log.more(JSON.stringify(data));

    jQuery.ajax({
      url: url,
      type: 'POST',
      data: data,
      success: ajaxOk,
      error: ajaxError
    });
    return false;
  }

  //-------------------- END UTILITY METHODS -------------------


  //--------------------- BEGIN DOM METHODS --------------------

  function loadContainer($container) {
    log.trace('::loadContainer ID=[' + $container.prop('id') + ']');

    var url = $container.data('url');
    var onLoad = $container.data('onload');  // name of callback function to be executed after load
    var onError = $container.data('onerror');  // name of callback function to be executed on error

    if (typeof url !== 'string' || url === '') {
      log.error('::loadContainer ERROR: missing url=[' + url + ']');
    }

    log.debug('::loadContainer Loading URL=[' + url + '] in container with ID=[' + $container.prop('id') + ']');

//    $cont.removeData('url');    /* don't remove urls - can be used to (re)load the frame again */
    $container.removeClass(configMap.frameLoadClass);

    function ajaxOk(data) {
      postProcessAjaxDataThenAddToDom($container, data);
      if (onLoad) {
        callOnLoadFunction(onLoad, $container);
      }
      callAllGlobalOnLoadFunctions($container);
    }

    function ajaxError(jqXHR, textStatus, errorThrown) {
      log.error('ERROR: ajaxError ( jqXHR = ' + jqXHR + ' / errorThrown = ' + errorThrown + ')');
      if (onError) {
        callOnErrorFunction(onError, $container, 'ERROR: ' + errorThrown);
      }
      callAllGlobalOnErrorFunctions($container, 'ERROR: ' + errorThrown);
    }

    $.ajax({
      url: url,
      type: 'GET',
      success: ajaxOk,
      error: ajaxError
    });
  }

  function setupClickAndSubmitEventListenersToContainer($container) {
    log.trace('::setupClickAndSubmitEventListenersToContainer ID=[' + $container.prop('id') + ']');
    /*
     * Attach click event handlers to all links in container
     * anchor links, form inputs (:submit and :image) that can submit the form
     * Keyboard form submit (via pressing enter) is also being captured by keypress callback
     * Delegated event handlers on container is being used.
     */

    $container.off('submit', 'form').on('submit', 'form', onSubmitForm);
    $container.off('click', 'a').on('click', 'a', onClickA);
    $container.off('click', ':submit,:image').on('click', ':submit,:image', onClickSubmitOrImage);
    $container.off('keypress', ':input').on('keypress', ':input', onKeypressFormField);
  }

  function postProcessAjaxDataThenAddToDom($container, data) {
    log.trace('::postProcessAjaxDataThenAddToDom ID=[' + $container.prop('id') + ']');

    var reloadByClass = $container.data('reloadByClass');

    $container.html(data);
    executeCommands(); // execute new commands after adding content to page

    setupClickAndSubmitEventListenersToContainer($container);

    if (typeof reloadByClass === 'string' && reloadByClass !== '') {
      log.trace('::loadContainer reloadByClass=[' + reloadByClass + ']');
      var $framesByClass = jqueryMap.$document.find('div.' + reloadByClass);
      log.more('::loadContainer $framesByClass.length=[' + $framesByClass.length + ']');
      $framesByClass.each(function () {
        var $frame = $(this);
        log.more('::loadContainer mark for load frame with ID=[' + $frame.prop('id') + '] URL=[' + $frame.data('url') + ']');
        $frame.addClass(configMap.frameLoadClass);
      });
    }

  }

  function executeCommands() {
    log.trace('::executeCommands');
    var $cmd = jqueryMap.$document.find(configMap.frameCommandSelectorStr + ':first');
    while ($cmd.length) {
      var cmdName = $cmd.data('name');
      if (cmdName && configMap.commands[cmdName] && typeof configMap.commands[cmdName] === 'function') {
        log.more('::executeCommands EXEC Command ' + cmdName);
        configMap.commands[cmdName]($cmd);
        $cmd.remove(); // remove div after executing the command!
      } else {
        log.error('ERROR: command "' + cmdName + '" not found');
        $cmd.remove();
      }
      $cmd = $(configMap.frameCommandSelectorStr + ':first');
    }
  }

  function executeLateCommands(lateGroupName) {
    log.trace('::executeLateCommands lateGroupName = ' + lateGroupName);
    var $lateGroup = jqueryMap.$document.find(configMap.frameLateCommandSelectorStr + '[data-group=' + lateGroupName + ']');

    log.more('::executeLateCommands lateGroup.len = ' + $lateGroup.length);
    if ($lateGroup.length === 0) {
      log.warn('::executeLateCommands WARNING: no commands found for lateGroupName = ' + lateGroupName);
    }

    for (var i = 0; i < $lateGroup.length; i += 1) {
      var $cmd = $($lateGroup[i]);
      var cmdName = $cmd.data('name');
      if (cmdName && configMap.commands[cmdName] && typeof configMap.commands[cmdName] === 'function') {
        log.more('::executeCommands EXEC Command ' + cmdName);
        configMap.commands[cmdName]($cmd);
      } else {
        log.error('ERROR: command "' + cmdName + '" not found');
//        $cmd.remove();
      }
    }
  }

  //--------------------- END DOM METHODS ----------------------


  //------------------- BEGIN EVENT HANDLERS -------------------

  function ajaxStart() {
    log.trace(loaderPassAsStr() + '::ajaxStart');
  }

  function ajaxStop() {
    stateMap.loaderPass += 1;
    log.trace(loaderPassAsStr() + '::ajaxStop NEXT loaderPass=[' + stateMap.loaderPass + ']');

    /*
     * Iterative call to load frames.
     * The end of loading frame via ajax triggers jQuery.ajaxStop(); which triggers another call to this function
     * Iteration stops when there are no more frames with .r_load_me on page. (real condition is on next line)
     * Iteration stops when there is no more events triggering jQuery.ajaxStop()
     * The good part is that loadFrame() is called when all ajax calls made by previous loadFrame() call are finished.
     * So no tracking of frames loads and multiple callback firing after each
     */
    loadFrames();
  }

  function onClickA(event) {
    log.trace('::onClickA (================ EVENT ================) tagName = ' + event.target.tagName);
    var $a = $(event.target).closest('a');
    var $frame = lookupDstFrameA($a);

    if ($frame === null) {
      log.more('::onClickA skipProcessingLink = TRUE');
      return true;  // this event should not be captured
    }

    var a_href = $a.prop('href');
    if (typeof a_href !== 'string' || a_href === '') {
      log.error('ERROR: Property HREF not found in A');
      return false;
    }

    $frame.addClass(configMap.frameLoadClass);
    $frame.data('url', a_href);
    loadFrames();
    return false;
  }

  function onClickReplaceMyself(event) {
    log.trace('::onClickReplaceMyself (================ EVENT ================)');
    var $link = $(event.target).closest(configMap.replaceMyselfSelector);

    if ($link.data('url')) {
      $.ajax({
        url: $link.data('url'),
        type: 'get',
        success: function (data) {
          $link.replaceWith(data);
        }
      });
    }
  }

  function onClickSubmitOrImage(event) {
    log.trace('::onClickSubmitOrImage (================ EVENT ================) target=[' + event.target.tagName + '#' + event.target.id + ']');
    var $submit = $(event.target);

    /* 'stealing' button to function as link instead to submit form */
    if ($submit.data('frame') && $submit.data('url')) {
      log.more('::onClickSubmitOrImage button hijack detected frame = ' + $submit.data('frame') + ' // url = ' + $submit.data('url'));
      var $targetFrame = jqueryMap.$document.find('#' + $submit.data('frame'));
      if ($targetFrame.length !== 1) {
        log.error('ERROR: frame not found! name = ' + $submit.data('frame'));
        return false;
      }

      $targetFrame.data('url', $submit.data('url'));
      $targetFrame.addClass(configMap.frameLoadClass);
      event.preventDefault();
      loadFrames();
      return false;
    }
    /* END 'stealing' */

    var buttonNameStr = $submit.prop('name');
    var $form = findFormFromButton($submit); // jQuery set of form object with added formId property
    if (!($form && $form.length === 1)) {
      log.error('Form not found');
      return false;
    }
    addHiddenButtonNameIfMissing($form, buttonNameStr);

    /* Should we submit with ajax instead */
    var lookupDstInfo = lookupDstFrameInfo($form);
    if (lookupDstInfo.skipProcessingLink) {
      log.more('::onClickSubmitOrImage skip processing link for <tag:type>=<' + event.target.tagName + ':' + event.target.type + '>');
      if (!stateMap.inputFormAttributeSupport) {
        log.more('::onClickSubmitOrImage INTERNAL SUBMIT of regular form!');
        $form.submit(); // triggers onSubmitForm
        return false;
      }
      log.more('::onClickSubmitOrImage exit with true - browser should submit form');
      return true;  // this event should not be captured by WEB_RELOADER => regular form submit
    }

    /* form submit via Ajax/XMLHttpRequest follows */
    /* begin form serialization */

    /* handleOnClickSubmitAndImage */
    var $dstFrame = $('#' + lookupDstInfo.frameId);
    var onLoad = $dstFrame.data('onload');
    var onError = $dstFrame.data('onerror');
    var url = $form.prop('action') || '.';

    function ajaxOk(data) {
      log.more("::onClickSubmitOrImage::ajaxOk data=" + data.substr(0,50));
      postProcessAjaxDataThenAddToDom($dstFrame, data);
      if (onLoad) {
        callOnLoadFunction(onLoad, $dstFrame);
      }
      callAllGlobalOnLoadFunctions($dstFrame);
    }

    function ajaxError(jqXHR, textStatus, errorThrown) {
      log.error('ERROR: ajaxError ( jqXHR = ' + jqXHR + ' / errorThrown = ' + errorThrown + ')');
      if (onError) {
        callOnErrorFunction(onError, $dstFrame, 'ERROR: ' + errorThrown);
      }
      callAllGlobalOnErrorFunctions($dstFrame, 'ERROR: ' + errorThrown);
    }

    if (window.FormData !== undefined) {
      log.trace('*** FormData Yes');
      // make sure that we can use FormData
      // ie>9, chrome>7, opera>12, safari>5, android>3
      // gecko mobile>2, opera mobile>12 <- will support XHR too
      var formData = new FormData($form[0]);
      if (!stateMap.inputFormAttributeSupport && typeof $form.formId === 'string') {
        log.trace('*** FormData Yes / form-attr No');
        $('[form="' + $form.formId + '"]').each(function () {
          var $this = $(this);
          //log.debug('name=' + $this.prop('name') + ' / type=' + $this.prop('name'));
          if ($this.prop('type') === 'file') {
            var files = $this[0].files;
            for (var i = 0; i < files.length; i++) {
              var file = files[i];
              formData.append($this.prop('name'), file, file.name);
            }
          } else {
            if ($this.prop('type') === 'checkbox' && $this.is(':checked')) {
              formData.append($this.prop('name'), $this.val() || "");
            } else {
              formData.append($this.prop('name'), $this.val() || "");
            }
          }
        });
      }

      $.ajax({
        url: url,
        type: "POST",
        data: formData,
        success: ajaxOk,
        error: ajaxError,
        processData: false,  // tell jQuery not to process the data
        contentType: false   // tell jQuery not to set contentType
      });

    } else {
      log.trace('FormData No');
      // NO FormData support in browser

      var $inputs = $form.find(':input[type!="file"]'); // input type!=file
      var $files = $form.find(':input[type="file"]'); // only input type=file

      if (typeof $form.formId === 'string') {
        log.more('::onClickSubmitOrImage searching for input elements by attribute [form=formId] for formId=[' + $form.formId + ']');
        $inputs = $inputs.add(':input[type!="file"][form="' + $form.formId + '"]');
        $files = $files.add(':input[type="file"][form="' + $form.formId + '"]');
      }
      var ajaxSettings = {
        url: url,
        type: 'POST',
        data: $inputs.serializeArray(),
        success: ajaxOk,
        error: ajaxError
      };

      if ($files.length > 0) {
        //alert(typeof $files[0].files);

        // case: ajax form with file upload
        $.extend(ajaxSettings, {
          files: $files,
          iframe: true,
          dataType: "html",
          processData: false
        });
        log.more("FILES!");
        jQuery.ajax(ajaxSettings);
      } else {
        // case: ajax form without file upload
        log.more("NO FILES!!!");
        jQuery.ajax(ajaxSettings);
      }
    }
    return false;
  }

  function onKeypressFormField(e) {
    log.trace('::onKeypressFormField (================ EVENT ================) e.keyCode = ' + e.keyCode);
    var $form;
    if (e.keyCode === 13) {      // submit the form if user presses Enter
      $form = $(e.target).closest('form');
      var $firstButton = $form.find(':submit:first');
      if ($firstButton.length > 0) {
        $firstButton.click();
      }
      return false;
    }
  }

  /*
   * Fix regular form submit in browser that doesn't support inputs outside the form tag
   *
   * <form id="form1">...</form>
   * <input form="form1">...
   *
   * This is achieved by cloning inputs outside the <form/> in it.
   *
   */
  function onSubmitForm(event) {
    log.trace('::onSubmitForm (================ EVENT ================) event.target.name=[' + event.target.name + '] / event.target.id=[' + event.target.id + ']');
    var $form = $(event.target);
    var formId = event.target.id;

    if (typeof formId !== 'string' || formId.length === 0) {
      //missing id on form - skipping;
      //log.trace('::onSubmitForm MISSING ID ON FORM. skip');
      return true;
    }

    if (stateMap.inputFormAttributeSupport === false) {
      var $controls = $(':input[form=' + formId + ']');
      $controls.each(function () {
        var $t = $(this);

        if ($t.closest('#' + formId).length === 0) {
          //log.more('Move inside form tag <' + $t[0].tagName + ':' + $t[0].type + '[name=' + $t.attr('name') + '][form=' + $t.attr('form') + ']#' + ($t.prop('id') ? $t.prop('id') : "---") + '>');
          $t.detach().prependTo($form);
        }
      });
    }
    log.more('::onSubmitForm return true - browser should submit');
    return true;
  }

  //-------------------- END EVENT HANDLERS --------------------


  //------------------- BEGIN PUBLIC METHODS -------------------

  // Begin Public method /initModule/
  function initModule() {

    setJqueryMap();

    log.warn('WEB_RELOADER v: ' + configMap.v + ' d: ' + configMap.d);
    log.trace('::initModule (============================= START OF NEW PAGE =============================)');

    /**
     * Disable caching of AJAX responses
     * cache: false
     * Is it good to not cache ajax calls?
     * WARNING: internally adds parameter _=<timestamp> to ajax requests
     */

    stateMap.inputFormAttributeSupport = testInputFormAttributeSupport();
    log.more('::initModule inputFormAttributeSupport=[' + stateMap.inputFormAttributeSupport + ']');

    jqueryMap.$document.off('submit' + configMap.eventNamespaceSuffix, 'form').on('submit' + configMap.eventNamespaceSuffix, 'form', onSubmitForm);
    jqueryMap.$document.off('click' + configMap.eventNamespaceSuffix, 'a').on('click' + configMap.eventNamespaceSuffix, 'a', onClickA);
    jqueryMap.$document.off('click' + configMap.eventNamespaceSuffix, ':submit,:image').on('click' + configMap.eventNamespaceSuffix, ':submit,:image', onClickSubmitOrImage);
    jqueryMap.$document.off('click' + configMap.eventNamespaceSuffix, configMap.replaceMyselfSelector).on('click' + configMap.eventNamespaceSuffix, configMap.replaceMyselfSelector, onClickReplaceMyself);
    jqueryMap.$document.ajaxStart(ajaxStart).ajaxStop(ajaxStop);
    loadFrames();
    return true;
  }

  // End PUBLIC method /initModule/

  // Begin Public method /loadFrames/
  function loadFrames() {
    log.trace('::loadFrames');

    executeCommands();
    /* execution of commands on initial page - e.g. loadFrame commands */

    var $framesToLoad = jqueryMap.$document.find(configMap.frameSelectorStr).filter(configMap.frameLoadSelectorStr);
    log.trace(loaderPassAsStr() + '-------- BEGIN: Entering loadFrames (framesToLoad=' + $framesToLoad.length + ')');

    if ($framesToLoad.length === 0) {
      stateMap.loaderPass = 0;
      log.trace(loaderPassAsStr() + '--------- EXIT: no more frames to load');
      /* https://gist.github.com/soul268/b0d680f9f1f936c3f311#file-web-reloader-js */
    }

    for (var i = 0; i < $framesToLoad.length; i += 1) {
      /* possible race condition if loadFrame or other command change frames inside loadContainer */
      var $container = $($framesToLoad[i]);
      if ($container.data('url')) {
        loadContainer($container);
      } else {
        log.error('ERROR: data-url missing! cannot load');
      }
    }
  }

  // End PUBLIC method /loadFrames/

  // Begin Public method /submitForm/
  function submitForm(formIdOrFormElement, divId) {
    log.trace('::submitForm formId=[' + formIdOrFormElement + '] divId=[' + divId + '] typeof formId=[' + (typeof formIdOrFormElement) + ']');

    var $overlayDiv = $('#' + divId);
    var $form;

    if (formIdOrFormElement instanceof HTMLFormElement) {
      $form = $(formIdOrFormElement);
    } else {
      if (typeof formIdOrFormElement !== 'string' || formIdOrFormElement.length === 0) {
        log.error('ERROR: invalid formId!');
        return false;
      }
      $form = $('#' + formIdOrFormElement);
    }

    if ($form.length !== 1) {
      log.error('ERROR: form not found! id=[' + formIdOrFormElement + ']');
      return false;
    }

    doSubmitForm($form, $overlayDiv);
  }

  // End PUBLIC method /submitForm/

  // Begin Public method /reloadFrame/
  function reloadFrame(frameId) {
    log.trace('::reloadFrame frameId=[' + frameId + ']');
    var $frame = $('#' + frameId);
    console.log($frame[0]);

    if ($frame.length !== 1) {
      log.error('ERROR: id not found! id=[' + frameId + ']');
      return false;
    }

    if (typeof $frame.data('url') !== 'string') {
      log.error('ERROR: Frame has no url! id=[' + frameId + ']');
      return false;
    }

    if ($frame.filter(configMap.frameSelectorStr).length !== 1) {
      log.error('ERROR: This is not a frame! id=[' + frameId + ']');
      return false;
    }

    $frame.addClass(configMap.frameLoadClass);
    loadFrames();
  }
  // End PUBLIC method /reloadFrame/

  return {
    initModule: initModule,
    loadFrames: loadFrames,    // external triggering of iterative page reload
    submitForm: submitForm,
    reloadFrame: reloadFrame
  };

  //------------------- END PUBLIC METHODS ---------------------

}(jQuery));

/* namespace for on load callback functions */
WEB_RELOADER.onload = {};

/* namespace for global on load callback functions */
WEB_RELOADER.global_onload = {};

/* namespace for on error callback functions */
WEB_RELOADER.onerror = {};

/* namespace for global on error callback functions */
WEB_RELOADER.global_onerror = {};

WEB_RELOADER.global_onerror.default_onerror = function ($frame, errMsg) {
  "use strict";
  if (typeof $frame === 'object') {
    $frame.html(errMsg);
  }
};
