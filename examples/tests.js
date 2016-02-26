/*jslint
 browser : true,
 unparam : true,
 indent  : 2,
 devel   : true,
 maxerr  : 50,
 nomen   : true,
 white   : true
 */
/*global WEB_RELOADER:true, $fixture:true, test, asyncTest, expect, ok, equal, notEqual, start, module, console, $, DEBUG_LOGGER*/

(function () {
  "use strict";
  var $fixture = $("#qunit-fixture");

  function removeStringFromArray(val, array) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i] === val) {
        array.splice(i, 1);
        break;
      }
    }
  }

  module("WEB_RELOADER exists");

  test("WEB_RELOADER exist on page", function () {
    expect(7);
    equal(WEB_RELOADER && typeof WEB_RELOADER, 'object', "WEB_RELOADER is object!");
    equal(WEB_RELOADER.initModule && typeof WEB_RELOADER.initModule, 'function', "WEB_RELOADER initModule is function!");
    equal(WEB_RELOADER.loadFrames && typeof WEB_RELOADER.loadFrames, 'function', "WEB_RELOADER.loadFrames is function!");
    equal(WEB_RELOADER.onload && typeof WEB_RELOADER.onload, 'object', "WEB_RELOADER.onload exists!");
    equal(WEB_RELOADER.global_onload && typeof WEB_RELOADER.global_onload, 'object', "WEB_RELOADER.global_onload exists!");
    equal(WEB_RELOADER.onload && typeof WEB_RELOADER.onerror, 'object', "WEB_RELOADER.onerror exists!");
    equal(WEB_RELOADER.global_onload && typeof WEB_RELOADER.global_onerror, 'object', "WEB_RELOADER.global_onerror exists!");
  });


  module('FRAME ONLOAD CALLBACK', {
    setup: function (assert) {
      WEB_RELOADER.onload.onload_test_callback = function ($frame) {
        ok(true, "onload callback executed!");
        equal($frame.length, 1, 'one object received as param');
        equal($frame[0].tagName.toLowerCase(), 'div', 'div received as param');
        equal($frame.prop('id'), 'dst_frame', 'div#dst_frame received as param');
        start();
      };
    },
    teardown: function (assert) {
      WEB_RELOADER.onload = {};
    }
  });

  asyncTest("test call to onload callback of r_frame", function () {
    expect(4);
    $fixture.html('<div id="dst_frame" class="r_frame r_load_me containerFrame1" data-url="frame1.html" data-onload="onload_test_callback"></div>');
    WEB_RELOADER.loadFrames();
  });

  asyncTest("test call to non-existing onload callback of r_frame", function () {
    expect(5);

    $fixture.html('<div class="r_frame r_load_me containerFrame1" data-url="frame1.html" data-onload="no_such_function"></div>');

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    $(document).one('ajaxStop', function () {
      equal($fixture.find('div.containerFrame1 > p.contentFrame1').length, 1, "loading of content successful");
      ok(true, "no_such_function call passed without error!");
      notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
      equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
      ok(/calling r_frame onload function \[no_such_function\] failed/.test(DEBUG_LOGGER.lastErrorMessage), "calling r_frame onload function no_such_function failed");
      start();
    });
    WEB_RELOADER.loadFrames();
  });


  module('GLOBAL ONLOAD CALLBACK', {
    setup: function (assert) {
      WEB_RELOADER.global_onload.global_test_callback = function ($frame) {
        ok(true, "global callback executed!");
        equal($frame.length, 1, 'one object received as param');
        equal($frame[0].tagName.toLowerCase(), 'div', 'div received as param');
        equal($frame.prop('id'), 'dst_frame', 'div#dst_frame received as param');
        start();
      };
    },
    teardown: function (assert) {
      WEB_RELOADER.global_onload = {};
    }
  });

  asyncTest("test automatic call to global on load callback", function () {
    expect(4);
    $fixture.html('<div id="dst_frame" class="r_frame r_load_me containerFrame1" data-url="frame1.html"></div>');
    WEB_RELOADER.loadFrames();
  });


  module('FRAME ONERROR CALLBACK', {
    setup: function (assert) {
      WEB_RELOADER.onerror.onerror_test_callback = function ($frame, errMsg) {
        ok(true, "onerror callback executed!");
        equal($frame.length, 1, 'one object received as param');
        equal(errMsg, 'ERROR: Not Found', 'ERROR: Not Found');
        start();
      };
    },
    teardown: function (assert) {
      WEB_RELOADER.onerror = {};
    }
  });

  asyncTest("test call to onerror callback of r_frame", function () {
    expect(3);
    $fixture.html('<div id="dst_frame" class="r_frame r_load_me containerFrame1" data-url="does-not-exist.html" data-onerror="onerror_test_callback"></div>');
    WEB_RELOADER.loadFrames();
  });


  module('GLOBAL ONERROR CALLBACK', {
    setup: function (assert) {
      WEB_RELOADER.global_onerror.onerror_test_callback = function ($frame, errMsg) {
        ok(true, "global onerror callback executed!");
        equal($frame.length, 1, 'one object received as param');
        equal(errMsg, 'ERROR: Not Found', 'ERROR: Not Found');
        start();
      };
    },
    teardown: function (assert) {
      WEB_RELOADER.global_onerror = {};
    }
  });

  asyncTest("test call to onerror callback of r_frame", function () {
    expect(3);
    $fixture.html('<div id="dst_frame" class="r_frame r_load_me containerFrame1" data-url="does-not-exist.html"></div>');
    WEB_RELOADER.loadFrames();
  });


  module("RUNNER FOR HTML EXAMPLES");

  asyncTest("WEB_RELOADER is loading frame1 in div-element (ex1.html)", function () {
    expect(1);

    $fixture.html('<div class="r_frame r_load_me containerFrame1" data-url="frame1.html"></div>');

    $(document).one('ajaxStop', function () {
      equal($fixture.find('div.containerFrame1 > p.contentFrame1').length, 1, "frame1 content found");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("WEB_RELOADER is loading frame1 in p-element (ex1.html)", function () {
    expect(1);

    $fixture.html('<p class="r_frame r_load_me containerFrame1" data-url="frame1.html"></p>');

    $(document).one('ajaxStop', function () {
      equal($fixture.find('p.containerFrame1 > p.contentFrame1').length, 1, "frame1 content found in p");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("WEB_RELOADER is loading frame1 in td-element (ex1.html)", function () {
    expect(1);

    $fixture.html('<table><tr><td class="r_frame r_load_me containerFrame1" data-url="frame1.html"></td></tr></table>');

    $(document).one('ajaxStop', function () {
      equal($fixture.find('td.containerFrame1 > p.contentFrame1').length, 1, "frame1 content found in td");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("WEB_RELOADER is chain loading frame2 --> frame1 (in r_frame in frame2) (ex2.html)", function () {
    expect(2);

    $fixture.html('<div class="r_frame r_load_me containerFrame2" data-url="frame2.html"></div>');

    $(document).one('ajaxStop', function () {
      $(document).one('ajaxStop', function () {
        equal($fixture.find('div.containerFrame2 > p.contentFrame2').length, 1, "frame2 > frame2.content found");
        equal($fixture.find('div.containerFrame2 > div.containerFrame1 > p.contentFrame1').length, 1, "frame2 > frame1 > frame1.content found");
        start();
      });
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("WEB_RELOADER takes click on link1 and loading #container --> frame1 (ex3.html - first link)", function () {
    expect(1);

    $fixture.html(
      '<p><a href="frame1.html" data-frame="container">load frame1 in container</a></p>' +
      '<div class="r_frame" id="container"></div>'
    );

    $(document).one('ajaxStop', function () {
      equal($fixture.find('#container > p.contentFrame1').length, 1, "#container > p.contentFrame1 found");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("WEB_RELOADER takes click on link2 and chain loading #container --> frame2 --> frame1", function () {
    expect(2);

    $fixture.html(
      '<p><a href="frame2.html" data-frame="container">load frame2 in container (frame2 itself loads frame1)</a></p>' +
      '<div class="r_frame" id="container"></div>'
    );

    $(document).one('ajaxStop', function () {
      $(document).one('ajaxStop', function () {
        equal($fixture.find('#container > p.contentFrame2').length, 1, "#container > p.contentFrame2 found");
        equal($fixture.find('#container > div.containerFrame1 > p.contentFrame1').length, 1, "#container > div.containerFrame1 > p.contentFrame1 found");
        start();
      });
    });
    $fixture.find('a:first').click();
  });


  module("testing the five html LINK CASES (see table in readme.html)");

  asyncTest("CASE 1 : link no capture outside frame", function () {
    expect(1);

    $fixture.html('<p id="captureClickHere"><a href="frame1.html">simulate open link on new page</a></p>');

    $fixture.find('#captureClickHere').click(function () {
      ok(true, "click is free!");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("CASE 2 : link no capture inside frame (frame=browser)", function () {
    expect(1);
    var $p;

    $fixture.html(
      '<div id="captureClickHere">' +
      '<div class="r_frame">' +
      '<a href="frame1.html" data-frame="window">simulate open this link on new page</a>' +
      '</div>' +
      '</div>'
    );

    $p = $fixture.find('#captureClickHere');
    $p.click(function () {
      ok(true, "click is free!");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("CASE 3 : link inside frame (no target frame) load inside same frame", function () {
    expect(1);
    $fixture.html('<div class="r_frame" id="container"><a href="frame1.html">link that loads frame1.html here</a></div>');
    $(document).one('ajaxStop', function () {
      equal($fixture.find('#container > p.contentFrame1').length, 1, "#container > p.contentFrame1 found");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("CASE 4 : link inside frame targeted to another frame", function () {
    expect(3);

    $fixture.html(
      '<div class="r_frame"><a href="frame1.html" data-frame="container">link that loads frame1.html into #container</a></div>' +
      '<div class="r_frame" id="container"></div>'
    );

    $(document).one('ajaxStop', function () {
      equal($fixture.find('div.r_frame').length, 2, "two div.r_frame found");
      equal($fixture.find('div.r_frame:first > a').length, 1, "div.r_frame:first > a found");
      equal($fixture.find('#container > p.contentFrame1').length, 1, "#container > p.contentFrame1 found");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("CASE 5 : link outside frame targeted to frame", function () {
    expect(3);

    $fixture.html(
      '<a href="frame1.html" data-frame="container">link that loads frame1.html into #container</a>' +
      '<div class="r_frame" id="container">'
    );

    $(document).one('ajaxStop', function () {
      equal($fixture.find('div.r_frame').length, 1, "two div.r_frame found");
      equal($fixture.find('> a').length, 1, "> a found in");
      equal($fixture.find('#container > p.contentFrame1').length, 1, "#container > p.contentFrame1 found");
      start();
    });
    $fixture.find('a:first').click();
  });


  module('FORMS');
  /* FORMS don't work under <IE9 */

  asyncTest("test form loading", function () {
    expect(5);

    $fixture.html('<div class="r_frame r_load_me" id="container" data-url="test_form.cgi">');

    $(document).one('ajaxStop', function () {
      equal($fixture.find('form[name=test_form]').length, 1, "form[name=test_form]");
      equal($fixture.find('#container > form[name=test_form]').length, 1, "#container > form[name=test_form] form is loaded in container");
      equal($fixture.find('#container > form[name=test_form] input:text[name=name]').length, 1, "#container > form[name=test_form] > input:text[name=name] found in container");
      equal($fixture.find('#container > form[name=test_form] input:text[name=name]').val(), "", "input:text[name=name] is empty");
      equal($fixture.find('#container > form[name=test_form] input:hidden[name=_button_name]').val(), "", "input:hidden[name=_button_name] is empty");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("test form post", function () {
    expect(7);

    $fixture.html('<div class="r_frame r_load_me" id="container" data-url="test_form.cgi">');

    $(document).one('ajaxStop', function () {
      $fixture.find('#container > form[name=test_form] input:text[name=name]').val('1234567');
      equal($fixture.find('form[name=test_form]').length, 1, "form[name=test_form] only one form loaded");
      equal($fixture.find('#container > form[name=test_form]').length, 1, "#container > form[name=test_form] form is loaded inside container");
      equal($fixture.find('#container > form[name=test_form] input:text[name=name]').length, 1, "#container > form[name=test_form] > input:text[name=name] found in container");
      equal($fixture.find('#container > form[name=test_form] input:text[name=name]').val(), "1234567", "input:text[name=name] value found after submit");
      equal($fixture.find('#container > form[name=test_form] input:hidden[name=_button_name]').val(), "", "input:hidden[name=_button_name] is empty");


      $fixture.find(':submit').click();
      $(document).one('ajaxStop', function () {
        var
          valueNameFound = false,
          valueButtonNameFound = false;

        $fixture.find('li').each(function () {
          if ($(this).text() === 'name=1234567') {
            valueNameFound = true;
          }
          if ($(this).text() === '_button_name=Submit') {
            valueButtonNameFound = true;
          }
        });
        ok(valueNameFound, 'value name found');
        ok(valueButtonNameFound, 'value _button_name found');
        start();
      });
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("data-frame on form redirects it to frame. FIXME this test fails under IE8!!!", function () {
    expect(3);
    var $first_div = $('<div></div>');
    $first_div.appendTo($fixture);
    $fixture.append('<div class="r_frame" id="container">');
    $first_div.load('test_form.cgi', function () {
      $fixture.find('> div:first > form[name=test_form]').attr('data-frame', 'container');
      $fixture.find('> div:first input[name=name]').val('form_test2');
      $fixture.find('> div:first input:submit[name=Submit]').trigger('click');
      $(document).one('ajaxStop', function () {
        var
          $form1 = $fixture.find('> div:first > form[name=test_form]'),
          buttonNameIsSubmitCount = 0,
          nameCount = 0;

        equal($form1.length, 1, "> div:first > form[name=test_form] present");

        $('#container').find('ul.param_values li').each(function () {
          var
            $this = $(this);

          if ($this.text() === '_button_name=Submit') {
            buttonNameIsSubmitCount += 1;
          }
          if ($this.text() === 'name=form_test2') {
            nameCount += 1;
          }
        });
        equal(buttonNameIsSubmitCount, 1, "hidden field _button_name was present in submit of form 1 (Submit is the name of the clicked button");
        equal(nameCount, 1, "> #container > [li]name=form_test2[/li] present");
        start();
      });
    });
  });

  asyncTest("steal form button", function () {
    expect(1);

    $fixture.html(
      "<div id='master_form'>" +
      "<form name='test_form' action='test_form.cgi' method='post' data-frame='container' >" +
      "<p>Name: <input type='text' name='name' value=''></p>" +
      "<p>Image: <input name='gopher' type='image' src='img/gopher_icon_128.png' alt='Gopher'></p>" +
      "<p><input name='Submit' type='submit' value='Submit' class='ok'></p>" +
      "<p><input name='ExternalCommand' type='submit' value='ExternalCommand' class='ok' data-frame='extra' data-url='frame1.html'></p>" +
      "<input type='hidden' name='_button_name'>" +
      "</form>" +
      "</div>" +
      '<div class="r_frame" id="container">' +
      '<div class="r_frame" id="extra">'
    );

    $(document).one('ajaxStop', function () {
      equal($fixture.find('#extra p.contentFrame1').length, 1, 'frame1 found in #extra');
      start();
    });
    $fixture.find('input:submit[name=ExternalCommand]').trigger('click');
  });

  test("steal form button: error on wrong frame", function () {
    expect(3);

    $fixture.html(
      "<div id='master_form'>" +
      "  <form name='test_form' action='test_form.cgi' method='post' data-frame='container' >" +
      "    <p>Name: <input type='text' name='name' value=''></p>" +
      "    <p>Image: <input name='gopher' type='image' src='img/gopher_icon_128.png' alt='Gopher'></p>" +
      "    <p><input name='Submit' type='submit' value='Submit' class='ok'></p>" +
      "    <p><input name='ExternalCommand' type='submit' value='ExternalCommand' class='ok' data-frame='extra_wrong' data-url='frame1.html'></p>" +
      "    <input type='hidden' name='_button_name'>" +
      "  </form>" +
      "</div>" +
      '<div class="r_frame" id="container">' +
      '<div class="r_frame" id="extra">'
    );

    $fixture.find('input:submit[name=ExternalCommand]').trigger('click');
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string");
    ok(/extra_wrong$/.test(DEBUG_LOGGER.lastErrorMessage), "invalid frame name found in error message");
  });

  asyncTest("steal form image", function () {
    expect(1);

    $fixture.html(
      "<div id='master_form'>" +
      "<form name='test_form' action='test_form.cgi' method='post' data-frame='container' >" +
      "<p>Name: <input type='text' name='name' value=''></p>" +
      "<p>Image: <input name='gopher' type='image' src='img/gopher_icon_128.png' alt='Gopher' data-frame='extra' data-url='frame1.html'></p>" +
      "<p><input name='Submit' type='submit' value='Submit' class='ok'></p>" +
      "<input type='hidden' name='_button_name'>" +
      "</form>" +
      "</div>" +
      "<div class='r_frame' id='container'></div>" +
      "<div class='r_frame' id='extra'></div>"
    );

    $(document).one('ajaxStop', function () {
      equal($fixture.find('#extra p.contentFrame1').length, 1, 'frame1 found in #extra');
      start();
    });
    $fixture.find('input[name=gopher]').trigger('click');
  });

  asyncTest("add hidden _button_name", function () {
    expect(1);

    $fixture.html(
      "<div id='master_form'>" +
      "<form name='test_form' action='test_form.cgi' method='post' data-frame='container' >" +
      "<p>Name: <input type='text' name='name' value=''></p>" +
      "<p><input name='Submit' type='submit' value='Submit' class='ok'></p>" +
      "</form>" +
      "</div>" +
      "<div class='r_frame' id='container'>"
    );
    $(document).one('ajaxStop', function () {
      var expectedValues = [
        '_button_name=Submit'
      ];

      $fixture.find('#container').find('li').each(function () {
        removeStringFromArray($(this).text(), expectedValues);
      });
      equal(expectedValues.length, 0, 'all expected post values found');
      start();
    });
    $fixture.find('input:submit[name=Submit]').trigger('click');
  });

  asyncTest("form submit using html5 form='id' (elements outside html tag)", function () {
    expect(1);

    $fixture.html(
      "<div class='r_frame' id='container'>" +
      "  <form name='test_form' action='post_echo.cgi' method='post' id='test_form'>" +
      "  </form>" +
      "</div>" +
      "<p>Name: <input type='text' name='name' value='' form='test_form'></p>" +
      "<p><input name='Submit' type='submit' value='Submit' form='test_form'></p>"
    );

    $(document).one('ajaxStop', function () {
      var expectedValues = [
        '_button_name=Submit',
        'name=123'
      ];

      $fixture.find('#container').find('li').each(function () {
        removeStringFromArray($(this).text(), expectedValues);
      });
      equal(
        expectedValues.length,
        0,
        expectedValues.length === 0 ? 'all expected post values found' : 'values missing in POST ' + expectedValues
      );

      start();
    });
    $fixture.find(':input[name=name]').val('123');
    $fixture.find(':submit[name=Submit]').trigger('click');
  });

  asyncTest("different form controls submit test (classic)", function () {
    expect(1);

    $fixture.html(
      "<div class='r_frame' id='container'>" +
      "    <form name='test_form' action='post_echo.cgi' method='post'>" +
      "        <select name='single' id='select1'>" +
      "            <option>Single</option>" +
      "            <option>Single2</option>" +
      "        </select>" +
      "        <br>" +
      "        <select name='multiple' multiple='multiple' id='select2'>" +
      "            <option selected='selected'>Multiple</option>" +
      "            <option>Multiple2</option>" +
      "            <option selected='selected'>Multiple3</option>" +
      "        </select>" +
      "        <br>" +
      "        <input type='checkbox' name='check' value='check1' id='ch1'>" +
      "        <label for='ch1'>check1</label>" +
      "        <input type='checkbox' name='check' value='check2' checked='checked' id='ch2'>" +
      "        <label for='ch2'>check2</label>" +
      "        <br>" +
      "        <input type='radio' name='radio' value='radio1' checked='checked' id='r1'>" +
      "        <label for='r1'>radio1</label>" +
      "        <input type='radio' name='radio' value='radio2' id='r2'>" +
      "        <label for='r2'>radio2</label>" +
      "        <input type='hidden' name='hidden_test' value='50'>" +
      "        <p><input name='Submit' type='submit' value='Submit' class='ok'></p>" +
      "    </form>" +
      "</div>"
    );

    $(document).one('ajaxStop', function () {
      var expectedValues = [
        'single=Single',
        'multiple=Multiple',
        'multiple=Multiple3',
        'check=check2',
        'radio=radio1',
        'hidden_test=100',
        '_button_name=Submit'
      ];

      $fixture.find('#container').find('li').each(function () {
        removeStringFromArray($(this).text(), expectedValues);
      });
      equal(expectedValues.length, 0, 'all expected post values found! MISSED:' + JSON.stringify(expectedValues));

      start();
    });
    $fixture.find(':input:hidden').val('100');
    $fixture.find(':submit[name=Submit]').trigger('click');
  });

  asyncTest("different form controls submit test (html5)", function () {
    expect(1);

    $fixture.html(
      "<div class='r_frame' id='container'>" +
      "    <form name='test_form' action='post_echo.cgi' method='post' id='form_id'>" +
      "    </form>" +
      "    <select name='single' id='select1' form='form_id'>" +
      "        <option>Single</option>" +
      "        <option>Single2</option>" +
      "    </select>" +
      "    <br>" +
      "    <select name='multiple' multiple='multiple' id='select2' form='form_id'>" +
      "        <option selected='selected'>Multiple</option>" +
      "        <option>Multiple2</option>" +
      "        <option selected='selected'>Multiple3</option>" +
      "    </select>" +
      "    <br>" +
      "    <input type='checkbox' name='check' value='check1' id='ch1' form='form_id'>" +
      "    <label for='ch1'>check1</label>" +
      "    <input type='checkbox' name='check' value='check2' checked='checked' id='ch2' form='form_id'>" +
      "    <label for='ch2'>check2</label>" +
      "    <br>" +
      "    <input type='radio' name='radio' value='radio1' checked='checked' id='r1' form='form_id'>" +
      "    <label for='r1'>radio1</label>" +
      "    <input type='radio' name='radio' value='radio2' id='r2' form='form_id'>" +
      "    <label for='r2'>radio2</label>" +
      "    <input type='hidden' name='hidden_test' value='50' form='form_id'>" +
      "    <p><input name='Submit' type='submit' value='Submit' class='ok' form='form_id'></p>" +
      "</div>"
    );

    $(document).one('ajaxStop', function () {
      var expectedValues = [
        'single=Single',
        'multiple=Multiple',
        'multiple=Multiple3',
        'check=check2',
        'radio=radio1',
        'hidden_test=100',
        '_button_name=Submit'
      ];

      function removeStringFromArray(val) {
        for (var i = 0; i < expectedValues.length; i += 1) {
          if (expectedValues[i] === val) {
            expectedValues.splice(i, 1);
            break;
          }
        }
      }

      $fixture.find('#container').find('li').each(function () {
        var key = $(this).text();
        removeStringFromArray(key);
        if (key === 'multiple=Multiple,Multiple3') {
          // fix for IE
          removeStringFromArray('multiple=Multiple');
          removeStringFromArray('multiple=Multiple3');
        }
      });
      equal(expectedValues.length, 0, 'all expected values found in array ' + (expectedValues.length > 0 ? "expectedValues=" + expectedValues.join() : ''));

      start();
    });
    $fixture.find(':input:hidden').val('100');
    $fixture.find(':submit[name=Submit]').trigger('click');
  });


  module("REPLACE MYSELF FUNCTION");

  asyncTest("span.r_replace_myself", function () {
    expect(1);
    $fixture.html('<p class="r_replace_myself" data-url="frame1.html">replace me</p>');
    $(document).one('ajaxStop', function () {
      equal($fixture.find('> p.contentFrame1').length, 1, "> p.contentFrame1 found");
      start();
    });
    $fixture.find('p').trigger('click');
  });


  module("ERROR MESSAGES");

  test("error message: link inside frame targeted to frame that doesn't exist", function () {
    expect(5);

    $fixture.html(
      '<div class="r_frame" >' +
      '<a href="frame1.html" data-frame="no_such_frame">link that tries to loads frame1.html into missing frame</a>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    $fixture.find('a:first').click();
    equal($fixture.find('div.r_frame').length, 1, "one div.r_frame found");
    equal($fixture.find('div.r_frame:first > a').length, 1, "div.r_frame:first > a found");
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string");
    ok(/no_such_frame$/.test(DEBUG_LOGGER.lastErrorMessage), "invalid frame name found in error message");
  });


  module("COMMANDS");

  test("Command: invalid command name error", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <p class="contentMainFrame">test</p>' +
      '  <div class="r_frame_command" data-name="invalid_command_name"></div>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check fixture layout */
    equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    ok(/invalid_command_name/.test(DEBUG_LOGGER.lastErrorMessage), "invalid_command_name found in error message");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command frameReplace: missing data-frame error", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <div class="r_frame_command" data-name="frameReplace"></div>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check fixture layout */
    equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    ok(/frameReplace called without data-frame/.test(DEBUG_LOGGER.lastErrorMessage), "frameReplace called without data-frame");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command frameReplace: non existent data-frame error", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <div class="r_frame_command" data-name="frameReplace" data-frame="no_such_frame"></div>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check fixture layout */
    equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    ok(/no_such_frame/.test(DEBUG_LOGGER.lastErrorMessage), "no_such_frame in error");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command frameReplace: test command (not in loaded frame)", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <p class="contentMainFrame">test</p>' +
      '  <div class="r_frame_command" data-name="frameReplace" data-frame="anotherFrameId">' +
      '    <p class="contentCommand">test</p>' +
      '  </div>' +
      '</div>' +
      '<div class="r_frame" id="anotherFrameId">' +
      '  <p class="contentAnotherFrame">test</p>' +
      '</div>'
    );

    WEB_RELOADER.loadFrames();
    //check fixture layout
    equal($fixture.find('> div.r_frame').length, 2, "> div.r_frame length is 2");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    equal($fixture.find('> div:last').prop('id'), "anotherFrameId", "> div:last is #anotherFrameId");
    // check function
    equal($fixture.find('#anotherFrameId > p.contentAnotherFrame').length, 0, "anotherFrame old content is gone");
    equal($fixture.find('#anotherFrameId > p.contentCommand').length, 1, "anotherFrame command content is here");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command loadFrame: missing data-url error", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <div class="r_frame_command" data-name="loadFrame"></div>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check fixture layout */
    equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    ok(/loadFrame called without data-url/.test(DEBUG_LOGGER.lastErrorMessage), "loadFrame called without data-url");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command loadFrame: missing data-frame AND command not inside r_frame", function () {
    expect(2);

    $fixture.html('<div class="r_frame_command" data-name="loadFrame" data-url="action.cgi"></div>');

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    //equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    //ok(/Unable to find destination frame/.test(DEBUG_LOGGER.lastErrorMessage), "Unable to find frame to load. lastErrorMsg=" + DEBUG_LOGGER.lastErrorMessage);
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  asyncTest("Command loadFrame: loading into parent div", function () {
    expect(2);
    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '<div class="r_frame_command" data-name="loadFrame" data-url="frame1.html"></div>' +
      '</div>'
    );
    $(document).one('ajaxStop', function () {
      equal($fixture.find('#mainFrameId p.contentFrame1').length, 1, "#mainFrameId p.contentFrame1");
      equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("Command reloadFrame: loading into parent div", function () {
    expect(2);
    $fixture.html(
      '<div class="r_frame" id="mainFrameId" data-url="frame1.html">' +
      '<div class="r_frame_command" data-name="reloadFrame"></div>' +
      '</div>'
    );
    $(document).one('ajaxStop', function () {
      equal($fixture.find('#mainFrameId p.contentFrame1').length, 1, "#mainFrameId p.contentFrame1");
      equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  asyncTest("Command reloadFrame: loading into another div", function () {
    expect(5);

    $fixture.html(
      '<div class="r_frame_command" data-name="reloadFrame" data-frame="testFrameId"></div>' +
      '<div class="r_frame" id="testFrameId" data-url="frame1.html">' +
      '  <p class="initialContent">test</p>' +
      '</div>'
    );

    $(document).one('ajaxStop', function () {
      //check fixture layout
      equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
      equal($fixture.find('> div:last').prop('id'), "testFrameId", "> div:last is #testFrameId");
      // check function
      equal($fixture.find('#testFrameId > p.initialContent').length, 0, "testFrame old content is gone");
      equal($fixture.find('#testFrameId p.contentFrame1').length, 1, "#testFrameId p.contentFrame1");
      equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
      start();
    });
    WEB_RELOADER.loadFrames();
  });

  test("Command reloadFrame: missing data-url on target frame error", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame" id="mainFrameId">' +
      '  <div class="r_frame_command" data-name="reloadFrame"></div>' +
      '</div>'
    );

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check fixture layout */
    equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
    equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    ok(/Command reloadFrame called on frame without data-url/.test(DEBUG_LOGGER.lastErrorMessage), "reloadFrame called on frame without data-url");
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  test("Command reloadFrame: missing data-frame on target AND command not inside r_frame", function () {
    expect(3);

    $fixture.html('<div class="r_frame_command" data-name="reloadFrame" data-url="action.cgi"></div>');

    delete DEBUG_LOGGER.lastErrorMessage; //remove previous error
    WEB_RELOADER.loadFrames();
    /* check function */
    notEqual(typeof DEBUG_LOGGER.lastErrorMessage, undefined, "DEBUG_LOGGER.lastErrorMessage defined");
    equal(typeof DEBUG_LOGGER.lastErrorMessage, "string", "DEBUG_LOGGER.lastErrorMessage is string = " + DEBUG_LOGGER.lastErrorMessage);
    equal($fixture.find('div.r_frame_command').length, 0, "command div is removed");
  });

  asyncTest("Command ordering example: Nesting loadFrame inside frameReplace", function () {
    expect(6);

    $fixture.html(
      '<div class="r_frame_command" data-name="loadFrame" data-frame="mainFrameId" data-url="frag001.html"></div>' +
      '<div class="r_frame" id="mainFrameId"></div>' +
      '<div class="r_frame" id="anotherFrameId"></div>'
    );

    $(document).one('ajaxStop', function () {
      $(document).one('ajaxStop', function () {
        //check fixture layout
        equal($fixture.find('> div.r_frame').length, 2, "> div.r_frame length is 2");
        equal($fixture.find('> div:first').prop('id'), "mainFrameId", "> div:first is #mainFrameId");
        equal($fixture.find('> div:last').prop('id'), "anotherFrameId", "> div:last is #anotherFrameId");
        // check function
        equal($fixture.find('#mainFrameId p.frag001').length, 1, "#mainFrameId p.frag001 " + $fixture.html());
        equal($fixture.find('#anotherFrameId p.frag002').length, 1, "#anotherFrameId p.frag002 " + $fixture.find('#anotherFrameId').html());
        equal($fixture.find('div.r_frame_command').length, 0, "commands are removed");
        start();
      });
    });
    WEB_RELOADER.loadFrames();
  });


  module("LATE COMMANDS");

  asyncTest("basic late command example", function () {
    expect(5);

    $fixture.html(
      '<div class="r_frame" id="container">' +
      '</div>' +
      '<div class="r_frame_late_command" data-group="g1" data-name="loadFrame" data-url="frame1.html" data-frame="container"></div>' +
      '<div class="r_frame_command" data-name="execGroup" data-value="g1"></div>'
    );

    $(document).one('ajaxStop', function () {
      //check fixture layout
      equal($fixture.find('> div.r_frame').length, 1, "> div.r_frame length is 1");
      equal($fixture.find('> div:first').prop('id'), "container", "> div:first is #container");
      // check function
      equal($fixture.find('#container p.contentFrame1').length, 1, "#container p.contentFrame1");
      equal($fixture.find('div.r_frame_command').length, 0, "commands are removed");
      equal($fixture.find('div.r_frame_late_command').length, 1, "late commands are not removed");
      start();
    });
    WEB_RELOADER.loadFrames();
  });


  module("FRAME RELOAD BY CLASS");

  asyncTest('frame reload by class', function () {
    expect(3);

    $fixture.html(
      '<div class="r_frame r_load_me" id="src_id" data-url="frame1.html" data-reload-by-class="markerClass"></div>' +
      '<div class="r_frame markerClass" id="dst_id" data-url="frag002.html"></div>'
    );

    $(document).one('ajaxStop', function () {
      $(document).one('ajaxStop', function () {
        //check fixture layout
        equal($fixture.find('div.r_frame').length, 2, "> div.r_frame length is 1");
        // check function
        equal($fixture.find('#src_id p.contentFrame1').length, 1, "#src_id p.contentFrame1");
        equal($fixture.find('#dst_id p.frag002').length, 1, "#dst_id p.frag002");
        start();
      });
    });
    WEB_RELOADER.loadFrames();
  });

  module("LINK(a) SKIP FRAME");

  asyncTest("skip-frame: value beyond existing parent frames count", function () {
    expect(1);

    $fixture.html('<p id="captureClickHere"></p>');
    $fixture.find('p').append('<div class="r_frame"><div class="r_frame"><div class="r_frame"><a href="frame1.html" data-skip-frame="3">skip-frame=3 link (beyond existing parent frames count)</a></div></div></div>');

    $fixture.find('#captureClickHere').click(function () {
      ok(true, "click is free!");
      start();
    });
    $fixture.find('a:first').click();
  });

  asyncTest("skip-frame: value to skip one", function () {
    expect(1);

    $fixture.html('<p id="captureClickHere"></p>');
    $fixture.find('p').append('<div class="r_frame"><div class="r_frame" id="container"><div class="r_frame"><a href="frame1.html" data-skip-frame="1">skip-frame=1 link</a></div></div></div>');

    //alert($fixture.html());
    $(document).one('ajaxStop', function () {
      equal($fixture.find('#container > p.contentFrame1').length, 1, '#container > p.contentFrame1 found');
      start();
    });
    $fixture.find('a:first').click();
  });

  module("WEB_RELOADER.reloadFrame(frameId) METHOD");

  asyncTest("method: reloadFrame", function () {
    expect(1);

    $fixture.html('<div class="r_frame" data-url="frame1.html" id="frame"></div>');

    $(document).one('ajaxStop', function () {
      equal($fixture.find('#frame > p.contentFrame1').length, 1, '#frame > p.contentFrame1 found');
      start();
    });
    WEB_RELOADER.reloadFrame('frame');
  });

}());