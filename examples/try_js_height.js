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

WEB_RELOADER.onload.onload_height = function ($f) {
  "use strict";
  console.log('Frame height=' + $f.css('height'));
  var $content = $f.find('> div.content');
  console.log($content);
  if ($content.length > 0) {
    console.log('Content length=' + $content.length + ' | height=' + $content.css('height'));
    var h1 = Math.round($content.height() + 25) + 'px';
    console.log('h1=' + h1);
    console.log($f);
    $f.animate({height: h1}, 500);
    setTimeout(function () {
      var h2 = Math.round($content.height() + 25) + 'px';
      console.log('h2=' + h2);
      $f.animate({height: h2}, 500);
    }, 250);
  } else {
    console.log('Content not found');
  }
};