/**
 * Drag and Drop Library For Drupal
 *
 * This builds on the DnD jQuery plugin written to provide drag and drop media
 * handling to Rich Text Editors to consume, display, and attach behavior to
 * a "media library" provided via JSON and implemented for Drupal running
 * the Wysiwyg plugin.
 */

/**
 *  Extend jQuery a bit
 *  
 *  We add a selector to look for "empty" elements (empty elements in TinyMCE
 *  often have non-breaking spaces and <br /> tags).  An exception is required
 *  to make this work in IE.
 */
(function($) {
  // Custom selectors
  $.extend($.expr[":"], {
    'dnd_empty' : function(a, i, m) {
      return !$(a).filter(function(i) {
        return !$(this).is('br');
      }).length && !$.trim(a.textContent || a.innerText||$(a).text() || "");
    }
  });
}) (jQuery);

/** 
 * Initialize and load drag and drop library and pass off rendering and
 * behavior attachment.
 */
Drupal.behaviors.dndLibrary = function(context) {
  if (!Drupal.settings.dndEnabledLibraries) {
    return;
  }
  $('.dnd-library-wrapper', context).each(function() {
    var $this = $(this);

    // This is a bad hack to lop off '-dnd-library' from the id to get the editor name
    var $editor = $('#' + this.id.slice(0, -12)); 

    // Set up some initial settings for BeautyTips
    var settings = Drupal.settings.dndEnabledLibraries[$editor.get(0).id] = $.extend({
      'btSettings' : {
        'trigger': ['click'],
        'width': 480,
        'spikeLength': 7,
        'spikeGirth': 9,
        'corner-radius' : 3,
        'strokeWidth': 1,
        'fill': '#ffd',
        'strokeStyle': '#555',
        'closeWhenOthersOpen': true
      },
      'libraryHoverIntentSettings' : {
        'interval': 500,
        'timeout' : 0,
        'over': function() {
          var $this = $(this);
          this.btOn();
          // Remove the preview once dragging of any image has commenced
          $('img', $this).bind('drag', function(e) {
            $this.btOff();
          });
          $('img', $this).bind('click', function(e) {
            $this.btOff();
          });
        }, 
        'out': function() { this.btOff(); }
      }
    }, Drupal.settings.dndEnabledLibraries[$editor.get(0).id]);

    // Bind Drag and Drop plugin invocation to events emanating from Wysiwyg
    $editor.bind('wysiwygAttach', Drupal.behaviors.dndLibrary.attach_library);
    $editor.bind('wysiwygDetach', Drupal.behaviors.dndLibrary.detach_library);

    // Set up empty objects to keep track of things
    Drupal.settings.dndEditorRepresentations = {};
    Drupal.settings.dndLibraryPreviews = {};
    
    // Clean up the url if needed (this happen in case drupal_add_js is called
    // multiple time for the page)
    if (settings.url instanceof Object) {
      settings.url = settings.url[0];
    }

    // Initialize the library
    var wrapper = $this.get(0);
    wrapper.library_url = Drupal.settings.basePath + settings.url;
    $.getJSON(Drupal.settings.basePath + '?q=' + settings.url, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(wrapper, data, $editor);
    });

  });
}

Drupal.behaviors.dndLibrary.renderLibrary = function(data, editor) {
  $this = $(this);

  $this.html(data.library);

  var settings = Drupal.settings.dndEnabledLibraries[editor.get(0).id];
  var params = Drupal.wysiwyg.instances[editor.get(0).id];

  editor.trigger('wysiwygDetach', params);
  editor.trigger('wysiwygAttach', params);

  for (editor_id in data.editor_representations) {
    Drupal.settings.dndEditorRepresentations[editor_id] = data.editor_representations[editor_id];
  }
  for (preview_id in data.library_previews) {
    Drupal.settings.dndLibraryPreviews[preview_id] = data.library_previews[preview_id];
  }

  // Add preview behavior to editor items (thanks, BeautyTips!)
  $('.editor-item', $this).each(function () {
    $(this).bt(Drupal.settings.dndLibraryPreviews[this.id], settings.btSettings);
    //$(this).hoverIntent(settings.libraryHoverIntentSettings);
  });

  // Preload images in editor representations
  var cached = $.data($(editor), 'dnd_preload') || {};
  for (editor_id in Drupal.settings.dndEditorRepresentations) {
    if (!cached[editor_id]) {
      $representation = $(Drupal.settings.dndEditorRepresentations[editor_id].body);
      if ($representation.is('img') && $representation.get(0).src) { 
        $representation.attr('src', $representation.get(0).src);
      } else {
        $('img', $representation).each(function() {
          $(this).attr('src', this.src);
        });
      }
    }
  }
  $.data($(editor), 'dnd_preload', cached);

  $('.pager a', $this).click(function() {
    // At page switching, close all opened BeautyTips.
    $('.editor-item.bt-active').btOff();
    $this.get(0).library_url = this.href;
    $.getJSON(this.href, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call($this.get(0), data, $(editor));
    });
    return false;
  });
  $('.view-filters input[type=submit]', $this).click(function() {
    var submit = $(this);
    $('.view-filters form', $this).ajaxSubmit({
      'url' : Drupal.settings.basePath + settings.url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = submit.parents('div.dnd-library-wrapper').get(0);
        target.library_url = this.url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      }
    });
    return false;
  });
  $('.view-filters input[type=reset]', $this).click(function() {
    var reset = $(this);
    $('.view-filters form', $this).ajaxSubmit({
      'url' : Drupal.settings.basePath + settings.url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = reset.parents('div.dnd-library-wrapper').get(0);
        target.library_url = Drupal.settings.dndEnabledLibraries[editor[0].id].url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      },
      'beforeSubmit': function (data, form, options) {
        // Can't use data = [], otherwise we're creating a new array
        // instead of modifying the existing one.
        data.splice(0, data.length);
      }
    });
    return false;
  });
  Drupal.attachBehaviors($this);
}

// Dynamically compose a callback based on the editor name
Drupal.behaviors.dndLibrary.attach_library = function(e, data) {
  var settings = $.extend({idSelector: Drupal.behaviors.dndLibrary.idSelector}, Drupal.settings.dndEnabledLibraries[data.field]);
  var editor_fn = 'attach_' + data.editor;
  if ($.isFunction(window.Drupal.behaviors.dndLibrary[editor_fn])) {
    window.Drupal.behaviors.dndLibrary[editor_fn](data, settings); 
  }
}

// Do garbage collection on detach
Drupal.behaviors.dndLibrary.detach_library = function(e, data) {}

// Basic textareas
Drupal.behaviors.dndLibrary.attach_none = function(data, settings) {
  settings = $.extend({
    targets: $('#'+ data.field),
    processTextAreaClick: function(clicked, representation_id, e, data) {
      var target = this, $target = $(target);

      // Update element count
      Drupal.behaviors.dndLibrary.countElements.call(target, representation_id);

      var rep = Drupal.settings.dndEditorRepresentations[representation_id];
      var snippet = '<div class="dnd-drop-wrapper">' + rep.body + '</div>';
      if (rep.meta.legend) {
        snippet += rep.meta.legend;
      }
      $target.replaceSelection(snippet, true);
    }
  }, settings);
  $(settings.drop_selector).dnd(settings);
}

// Attach TinyMCE
Drupal.behaviors.dndLibrary.attach_tinymce = function(data, settings) {
  var tiny_instance = tinyMCE.getInstanceById(data.field);

  // If the Tiny instance exists, attach directly, otherwise wait until Tiny
  // has registered a new instance.
  if (tiny_instance) { 
    Drupal.behaviors.dndLibrary._attach_tinymce(data, settings, tiny_instance);
  } else {
    var t = setInterval(function() {
      var tiny_instance = tinyMCE.getInstanceById(data.field);
      if (tiny_instance) {
        Drupal.behaviors.dndLibrary._attach_tinymce(data, settings, tiny_instance);
        $('#'+ data.field +'-wrapper').trigger('dnd_attach_library');
        clearInterval(t);
      }
    }, 100);
  }
}

Drupal.behaviors.dndLibrary.idSelector = function(element) { 
  if ($(element).is('img')) {
    return $.url.setUrl(element.src).param('dnd_id');
  }
  return false;
}

// Really attach TinyMCE
Drupal.behaviors.dndLibrary._attach_tinymce = function(data, settings, tiny_instance) {
  var ed = tiny_instance, dom = ed.dom, s = ed.selection;

  settings = $.extend({
    targets: $('#'+ data.field +'-wrapper iframe'),
    processTargets: function(targets) {
      return targets.each(function() {
        var target = this
        // Decrement counter on delete
        $(target).bind('dnd_delete', function(e, data) {
          Drupal.behaviors.dndLibrary.countElements(target, $(data.node).attr('dnd_id'), true); 
        });
        $('head', $(this).contents()).append('<style type="text/css">img.drop { display: none; } div.dnd-drop-wrapper {background: #efe; border: 1px #090 solid;}</style>');
        $('body', $(this).contents()).addClass($('body').attr('class'));
        return this;
      });
    },
    processIframeDrop: function(drop, id_selector) {
      var representation_id = id_selector.call(this, drop);
      if (!Drupal.settings.dndEditorRepresentations[representation_id]) return;
      var representation = Drupal.settings.dndEditorRepresentations[representation_id].body;
      var legend = Drupal.settings.dndEditorRepresentations[representation_id].meta.legend;
      var target = this, $target = $(target), $drop = $(drop), block;

      // Update element count
      Drupal.behaviors.dndLibrary.countElements(target, representation_id);

      // Search through block level parents
      $drop.parents().each(function() {
        var $this = $(this);
        if ($this.css('display') == 'block') {
          block = this;
          return false;
        }
      });

      // Remove dropped item
      $drop.remove();

      // Create an element to insert
      var insert = dom.create('div', {'class' : 'dnd-drop-wrapper', 'id' : 'dnd-inserted'}, representation);

      // The no-parent case
      if ($(block).is('body')) {
        // Never seem to be hit ?
        s.setNode(insert);
      }
      else {
        var old_id = block.id;
        block.id = 'target-block';
        $block = $('#target-block', $target.contents());

        // @TODO is finding the parent broken in safari??
        var snip = '<div class="dnd-drop-wrapper" id="dnd-inserted">' + representation + '</div>';
        if (legend) {
          snip += legend;
        }
        $block.after(snip);

        // The active target block should be empty
        if ($('#target-block:dnd_empty', $target.contents()).length > 0) {
          $('#target-block', $target.contents()).remove();
        } else if (old_id) {
          block.id = old_id;
        } else {
          $block.removeAttr('id');
        }
      } 

      var $inserted = $('#dnd-inserted', $target.contents());
      var inserted = $inserted.get(0);

      // Look behind in the DOM
      var previous = $inserted.prev().get(0);

      // If the previous element is also an editor representation, we need to
      // put a dummy paragraph between the elements to prevent editor errors.
      if (previous ) {
        $inserted.before('<p></p>');
      }

      // Look ahead in the DOM
      var next = $inserted.next().get(0);

      // If the next item exists and isn't an editor representation, drop the
      // caret at the beginning of the element, otherwise make a new paragraph
      // to advance the caret to.
      if (next && !$(next).hasClass('dnd-drop-wrapper')) {
        $(next).prepend('<span id="__caret">_</span>');
      }
      else if (!$(next).hasClass('dnd-drop-wrapper')) {
        var after = dom.create('p', {}, '<span id="__caret">_</span>');
        dom.insertAfter(after, 'dnd-inserted');
      }
 
      // Force selection to reset the caret
      var c = dom.get('__caret');
      if (c) {
        s.select(c);
        ed.execCommand('Delete', false, null);
        dom.remove(c);
      }

      // Unset id for next drop and add special dnd attribute for counting
      // purposes
      $inserted
        .removeAttr('id')
        .attr('dnd_id', representation_id);

    }
  }, settings);

  $(settings.drop_selector).dnd(settings);
}


// Keep a counter of times a representation ID has been used
Drupal.behaviors.dndLibrary.countElements = function(target, representation_id, decrement) {
  var counter = $(target).data('dnd_representation_counter');      
  if (!counter) {
    counter = {}
    counter[representation_id] = 1;
  } else if (counter && !counter[representation_id]) {
    counter[representation_id] = 1;
  } else {
    counter[representation_id] = counter[representation_id] + ((decrement) ? -1 : 1);
  }
  $(target).data('dnd_representation_counter', counter);
  return counter[representation_id];
}

/**
 * Refresh the library.
 */
Drupal.dnd = {}
Drupal.dnd.refreshLibraries = function() {
	var settings = Drupal.settings.dndEnabledLibraries;
	for (editor_id in settings) {
		var elem = $("#" + settings[editor_id].library_id).get(0);
		var $editor = $("#" + editor_id);
    $.getJSON(elem.library_url, function (data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(elem, data, $editor);
    });
  }
}
