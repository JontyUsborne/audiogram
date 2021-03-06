var audio = require('./audio');
var video = require('./video');
var preview = require('./preview');
var transcript = require('./transcript');
var logger = require('./slack');
var utils = require('./utils');

var MEDIA = {};
var BLOBS = {};

function _get(type) {
    return type ? MEDIA[type] : MEDIA;
}

function _set(obj, type) {
    if (type) {
        MEDIA[type] = obj
    } else {
        MEDIA = obj;
    }
    if (type == 'audio' && MEDIA.audio.mimetype) {
        var sourceIsVideo = MEDIA.audio.mimetype.startsWith("video");
        if (sourceIsVideo) {
            jQuery("#input-background-type option[value='source']").attr("disabled", false);
            jQuery("#input-background-type").val('source');
        } else {
            jQuery("#input-background-type option[value='source']").attr("disabled", true);
            var currentBackgroundType = jQuery("#input-background-type").val();
            if (currentBackgroundType == 'source') jQuery("#input-background-type").val('default');
        }
        var updateDesignTab = require('./themeHelper').updateDesignTab;
        updateDesignTab();
    }
    return MEDIA;
}

function _blobs(type) {
    return type ? BLOBS[type] : BLOBS;
}

function loadFromURL(type, url, cb) {
    var blob = null;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.onload = function() {
        BLOBS[type] = xhr.response;
        if (type == 'audio') {
            update(xhr.response, cb);
        } else {
            var themeHelper = require("./themeHelper");
            themeHelper.updateImage(null, type, xhr.response, cb);
        }
    };
    xhr.send();
}

function update(blob, cb) {
    if (!(blob instanceof Blob)) blob = false;

    jQuery('#row-audio').removeClass('error');
    audio.pause();
    video.kill();
    var audioFile = blob || jQuery('#input-audio').get(0).files[0];

    // Skip if empty
    if (!audioFile) {
        jQuery('#minimap').removeClass('hidden');
        preview.file(null);
        utils.setClass(null);
        return true;
    }

    var filename = blob ? 'blob' : jQuery('#input-audio').val().split('\\').pop();
    var size = audioFile.size / 1000000;

    if (size >= 150) {
        utils.setClass( 'error', 'Maximum upload size is 150MB. (Audio: ' + filename + ' - ' + Math.round(size * 10) / 10 + 'MB)' );
        jQuery('body').attr('class', 'landing error');
        return;
    }

    if (!LOADING) transcript.generate(audioFile);

    jQuery('#splash').addClass('hidden');
    jQuery('#subtitles, #transcript').removeClass('hidden');
    jQuery('#loading-message').text('Analyzing...');
    utils.setClass('loading');
    
    preview.loadAudio(audioFile, function(err){
        jQuery('#minimap, #submit').removeClass('hidden');
        if (err) {
            jQuery('#row-audio').addClass('error');
            utils.setClass('error', 'Error decoding audio file (' + filename + ')');
            if (cb) cb(err);
            jQuery('#minimap, #submit').addClass('hidden');
        } else {
            if (!LOADING) {
                utils.setClass('loading');
                BLOBS['audio'] = audioFile;
                upload('audio', audioFile);
            } else {
                utils.setClass(null);
            }
            if (!blob) logger.info( USER.name + ' uploaded a local audio file: ' + filename );
            if (cb) cb(null);
        }
    });
}

function deleteAll() {
    for (var type in MEDIA) {
        deleteMedia(type);
    }
    var deleteMediaSelector = require("./mediaSelector").purge;
    deleteMediaSelector();
}

function deleteMedia(type, id) {
    if (!type || (!MEDIA[type] && !id)) return;
    id = id || MEDIA[type].id;
    jQuery.get("/delete/" + type + "/" + id);
    delete MEDIA[type];
    delete BLOBS[type];
}

function upload(type, blob) {  // Reset
    var oldId = MEDIA[type] ? MEDIA[type].id : null;
    deleteMedia(type);
    if (!blob || LOADING) return;
    _set({
        id: oldId,
        name: blob.name || "blob",
        size: blob.size
    }, type);
    BLOBS[type] = blob;
    // Prepare payload
    var formData = new FormData();
    formData.append('type', type);
    formData.append('file', blob);
    // AJAX submit
    jQuery.ajax({
        async: true,
        url: '/upload/',
        type: 'POST',
        data: formData,
        contentType: false,
        dataType: 'json',
        cache: false,
        processData: false,
        success: function(res) {
            if (MEDIA[res.type] && res.name == MEDIA[res.type].name && res.size == MEDIA[res.type].size) {
                for (var type in MEDIA) {
                    if (type !== 'audio' && MEDIA[res.type].id == MEDIA[type].id && type !== res.type) {
                        _set(Object.assign({}, res, { type }), type);
                    }
                }
                _set(res, res.type);
            }
        },
        error: error
    });
}

module.exports = {
    loadFromURL,
    update,
    upload,
    get: _get,
    set: _set,
    blobs: _blobs,
    deleteAll,
    deleteMedia
};
