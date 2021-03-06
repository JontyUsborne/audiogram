var startTime = Date.now();

global.d3 = require("d3");
global.jQuery  = require("jquery");
global.$ = jQuery;

var path = require("path");

var utils = require('./utils');
var transcript = require('./transcript');
var transcriptTimings = require('./transcriptTimings');
var logger = require('./slack');
var preview = require('./preview');
var minimap = require('./minimap');
var video = require('./video');
var audio = require('./audio');
var media = require('./media');
var projects = require('./projects');
var ui = require('./ui');
var themeHelper = require('./themeHelper');
var ichef = require('./ichef');
var mediaSelector = require('./mediaSelector');
var submit = require('./submit');
var vcs = require('./vcs');
var png = require('./png');
var webcap = require('./webcap');
var user = require('./user');

window.onerror = function (error, url, line) {
  var errorJSON = { error, source: url + ':' + line };
  // TODO: send to logger
};

global.LOADING = true;
jQuery('#version').text('Version: __VERSION__');

// Check DB status
jQuery.ajax({
  url: "/redis",
  error: function() {
    utils.offline("The Audiogram database is currently offline. It is sometimes rebooted routinely and should only take a few minutes to start up. Please try again shortly.");
  },
  success: function(data) {
    if (!data.error && data.info) {
      if (data.info.loading == 1) {
        utils.offline("The Audiogram database is currently restarting and will be back online soon.");
      }
    }
  },
  timeout: 3000
});

// Initialize components
jQuery(function () {

  var initQueue = d3.queue();
  initQueue.defer(user.init);
  initQueue.defer(ui.init);
  initQueue.defer(audio.init);
  initQueue.defer(mediaSelector.init);
  initQueue.defer(minimap.init);
  initQueue.defer(projects.init);
  initQueue.defer(submit.init);
  initQueue.defer(transcript.init);
  initQueue.defer(transcriptTimings.init);
  initQueue.defer(vcs.init);
  initQueue.defer(png.init);
  initQueue.defer(webcap.init);
  initQueue.defer(preview.init);
  initQueue.defer(themeHelper.init);

  initQueue.await(function (err) {
    if (err) return console.error(err);
    load();
  });

});

function load(){
  // Load theme list
  themeHelper.loadThemeList(function (err) {
    // console.log('THEMES ALL LOADED', err);
  });
  // Tooltips
  utils.tooltips();
  // Log load time
  var duration = Date.now() - startTime;
  utils.stats("timing", "load_time", duration);
  // Either load project or landing page
  var path = window.location.pathname.split("/");
  if (path[1] == "ag") {
    var id = path[2];
    projects.load(id);
  } else {
    utils.setClass("landing");
  }
}



// d3.json("/settings/themes.json", function(err, themes){

//   console.log('Parsing themes...');

//   var errorMessage;

//   // Themes are missing or invalid
//   if (err || !d3.keys(themes).filter(function(d){ return d !== "default"; }).length) {
//     if (err instanceof SyntaxError) {
//       errorMessage = "Error in settings/themes.json:<br/><code>" + err.toString() + "</code>";
//     } else if (err instanceof ProgressEvent) {
//       errorMessage = "Error: no settings/themes.json.";
//     } else if (err) {
//       errorMessage = "Error: couldn't load settings/themes.json.";
//     } else {
//       errorMessage = "No themes found in settings/themes.json.";
//     }
//     d3.select("#loading-bars").remove();
//     d3.select("#loading-message").html(errorMessage);
//     if (err) {
//       logger.error(errorMessage,err);
//       throw err;
//     }
//     return;
//   }

//   for (var key in themes) {
//     themes[key].name = key;
//     var raw = JSON.stringify(themes[key]);
//     if (key!="default") themes[key]["raw"] = JSON.parse(raw);
//     themes[key] = jQuery.extend({}, themes.default, themes[key]);
//   }

//   var themesStr = JSON.stringify(themes);
//   themeHelper.raw(JSON.parse(themesStr));

//   preloadImages(themes);

// });

// Once images are downloaded, set up listeners
function initialize(err, themesWithImages) {

  console.log("Initializing...");

  // Populate dropdown menu
  // d3.select("#input-theme")
  //   .on("change", themeHelper.update)
  //   .selectAll("option")
  //   .data(themesWithImages)
  //   .enter()
  //   .append("option")
  //     .text(function(d){
  //       return d.name;
  //     });


  // Get initial theme
  // d3.select('#input-theme').each(themeHelper.update);

  // Select default theme
  // jQuery(function() {
    // jQuery("#input-theme option:first").after("<option disabled></option>");
    // jQuery("#input-theme").val(jQuery("#input-theme option:eq(2)").val());
    // var sel = jQuery("#input-theme").get(0);
    // themeHelper.update(d3.select(sel.options[sel.selectedIndex]).datum());
  // });


}

// function preloadImages(themes) {

//   return initialize(null, themes);

//   console.log('Loading images...');

//   // preload images
//   var themeQueue = d3.queue();
//   d3.entries(themes).forEach(function(theme){
//     if (!theme.value.name) {
//       theme.value.name = theme.key;
//     }
//     if (theme.key !== "default") {
//       themeQueue.defer(getImages, theme.value);
//     }
//   });
//   themeQueue.awaitAll(initialize);

//   function getImages(theme, cb) {

//     if (!theme.backgroundImage && !theme.foregroundImage) {
//       return cb(null, theme);
//     }

//     var imageQueue = d3.queue();

//     // Load background images
//     theme.backgroundImageFile = theme.backgroundImageFile || {};
//     theme.backgroundImageInfo = theme.backgroundImageInfo || {};
//     for(orientation in theme.backgroundImage){
//       // Load each image
//       imageQueue.defer(function(orientation, imgCb){
//         theme.backgroundImageFile[orientation] = new Image();
//         theme.backgroundImageFile[orientation].onload = function(){
//           theme.backgroundImageInfo[orientation] = {type: "image", height: this.height, width: this.width};
//           return imgCb(null);
//         };
//         theme.backgroundImageFile[orientation].onerror = function(e){
//           console.warn(e);
//           return imgCb(e);
//         };
//         theme.backgroundImageFile[orientation].src = "/settings/backgrounds/" + theme.backgroundImage[orientation];  //Q.  i thought there needs to be an explicit return statement.  or is this all side-effect making?
//       }, orientation);
//     }

//     // Load foreground images
//     theme.foregroundImageFile = theme.foregroundImageFile || {};
//     for(orientation in theme.foregroundImage){
//       // Load each image
//       imageQueue.defer(function(orientation, imgCb){
//         theme.foregroundImageFile[orientation] = new Image();
//         theme.foregroundImageFile[orientation].onload = function(){
//           return imgCb(null);
//         };
//         theme.foregroundImageFile[orientation].onerror = function(e){
//           console.warn(e);
//           return imgCb(e);
//         };
//         theme.foregroundImageFile[orientation].src = "/settings/backgrounds/" + theme.foregroundImage[orientation];  //Q.  i thought there needs to be an explicit return statement.  or is this all side-effect making?
//       }, orientation);
//     }

//     // Update raw themes
//     var raw = themeHelper.raw();
//     raw[theme.name].backgroundImageFile = theme.backgroundImageFile;
//     raw[theme.name].backgroundImageInfo = theme.backgroundImageInfo;
//     raw[theme.name].foregroundImageFile = theme.foregroundImageFile;
//     themeHelper.raw(raw);

//     // Finished loading this theme
//     imageQueue.await(function(err){
//       return cb(err, theme);
//     });

//   }

// }

jQuery(window).bind("beforeunload", function() {
  media.deleteAll();
  jQuery.getJSON('/logout');
});
