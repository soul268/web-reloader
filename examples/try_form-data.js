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
/*global $, jQuery, DEBUG_LOGGER*/

function postFormData(url, formData) {
  "use strict";
  var oOutput = document.getElementById("output");

  $.ajax({
    url: "post_echo.cgi",
    type: "POST",
    data: formData,
    success: function (data, status, jqXHR) {
      oOutput.innerHTML = jqXHR.responseText;
    },
    processData: false,  // tell jQuery not to process the data
    contentType: false   // tell jQuery not to set contentType
  });
}

var $form0 = $('#form0');

$form0.submit(function (ev) {
  "use strict";
  ev.preventDefault();

  var oData = new FormData($form0[0]);
  oData.append("CustomField", "5");

  postFormData("post_echo.cgi", oData);

});

var $form9 = $('#form9');
$form9.submit(function (ev) {
  "use strict";
  ev.preventDefault();

  var oOutput = document.getElementById("output");
  var oData = new FormData($form9[0]);

  oData.append("CustomField", "100");

  postFormData("post_echo.cgi", oData);
});


