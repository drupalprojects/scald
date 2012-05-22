/**
 * Drag and Drop Library For Drupal
 *
 * This builds on the DnD jQuery plugin written to provide drag and drop media
 * handling to Rich Text Editors to consume, display, and attach behavior to
 * a "media library" provided via JSON and implemented for Drupal running
 * the Wysiwyg plugin.
 */

/**
 * Initialize our namespace.
 */
Drupal.dnd = {};
Drupal.dnd.Atoms = {};
Drupal.dnd.btSettings = {
  'trigger': ['click'],
  'width': 480,
  'spikeLength': 7,
  'spikeGirth': 9,
  'corner-radius' : 3,
  'strokeWidth': 1,
  'fill': '#fff',
  'shadow': true,
  'shadowColor': '#666',
  'strokeStyle': '#999',
  'closeWhenOthersOpen': true
};

(function($) {

/**
 *  Extend jQuery a bit
 *
 *  We add a selector to look for "empty" elements (empty elements in TinyMCE
 *  often have non-breaking spaces and <br /> tags).  An exception is required
 *  to make this work in IE.
 */
// Custom selectors
$.extend($.expr[":"], {
  'dnd_empty' : function(a, i, m) {
    return !$(a).filter(function(i) {
      return !$(this).is('br');
    }).length && !$.trim(a.textContent || a.innerText||$(a).text() || "");
  }
});

/**
 * Initialize and load drag and drop library and pass off rendering and
 * behavior attachment.
 */
Drupal.behaviors.dndLibrary = {
attach: function(context, settings) {
  if (!Drupal.settings.dndDropAreas || Drupal.settings.dnd.suppress) {
    return;
  }

  // Bind our functions to WYSIWYG attach / detach events
  for (editor in Drupal.settings.dndDropAreas) {
    var $editor = $('#' + editor, context);

    // Bind Drag and Drop plugin invocation to events emanating from Wysiwyg
    $editor.bind('wysiwygAttach', Drupal.behaviors.dndLibrary.attach_library);
    $editor.bind('wysiwygDetach', Drupal.behaviors.dndLibrary.detach_library);
  }

  if ($(".node-form:not(.dnd-processed)").length) {
    $(".node-form")
      .addClass('dnd-processed')
      .append('<div class="dnd-library-wrapper"></div>');
    var wrapper = $('.node-form .dnd-library-wrapper');
    $editor = $("<a />");
    wrapper.library_url = Drupal.settings.dnd.url;
    $.getJSON(wrapper.library_url, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(wrapper, data, $editor);
    });
  }
},

renderLibrary: function(data, editor) {
  $this = $(this);

  // Save the current status
  var dndStatus = {
    search: $this.find('.scald-menu').hasClass('search-on')
    ,library: $this.find('.dnd-library-wrapper').hasClass('library-on')
  };

  $this.html(data.menu + data.anchor + data.library);

  // Rearrange some element for better logic and easier theming.
  // @todo We'd better do it on server side.
  $this.find('.scald-menu')
    .prepend($this.find('.summary'))
    .append($this.find('.view-filters').addClass('filters'));
  if (dndStatus.search) {
    $this.find('.scald-menu').addClass('search-on');
    $this.find('.dnd-library-wrapper').addClass('library-on');
  }
  $this.find('.summary .toggle').click(function() {
    // We toggle class only when animation finishes to avoid flash back.
    $('.scald-menu').animate({left: $('.scald-menu').hasClass('search-on') ? '-42px' : '-256px'}, function() {
      $(this).toggleClass('search-on');
    });
    // When display search, we certainly want to display the library, too.
    if (!$('.scald-menu').hasClass('search-on') && !$('.dnd-library-wrapper').hasClass('library-on')) {
      $('.scald-anchor').click();
    }
  });
  $this.find('.scald-anchor').click(function() {
    // We toggle class only when animation finishes to avoid flash back.
    $('.dnd-library-wrapper').animate({right: $('.dnd-library-wrapper').hasClass('library-on') ? '-276px' : '0'}, function() {
      $('.dnd-library-wrapper').toggleClass('library-on');
    });
  });

  var settings = Drupal.settings.dndDropAreas[editor.get(0).id];
  if (Drupal.wysiwyg) {
    var params = Drupal.wysiwyg.instances[editor.get(0).id];
    editor.trigger('wysiwygDetach', params);
    editor.trigger('wysiwygAttach', params);
  }

  for (atom_id in data.atoms) {
    // Store the atom data in our object
    Drupal.dnd.Atoms[atom_id] = data.atoms[atom_id];
    // And add a nice preview behavior thanks to BeautyTips
    $("#sdl-" + atom_id).bt(Drupal.dnd.Atoms[atom_id].preview, Drupal.dnd.btSettings);
  }

  // Preload images in editor representations
  var cached = $.data($(editor), 'dnd_preload') || {};
  for (editor_id in Drupal.dnd.Atoms) {
    if (!cached[editor_id]) {
      $representation = $(Drupal.dnd.Atoms[editor_id].editor);
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

  // Set up drag & drop data
  $('.editor-item .drop').each(function(i) {
    $(this)
      .bind('dragstart', function(e) {
        var dt = e.originalEvent.dataTransfer, id = e.target.id, $this = $(this);
        var $img;
        if ($this.is('img')) {
          $img = $this;
        }
        else {
          $this.find('img');
        }
        var id = $.url.setUrl($img.attr('src')).param('dnd_id');
        dt.dropEffect = 'copy';
        dt.setData('Text', id);
        dt.setData('text/html', "<img src='" + $img.attr('src') + "' class='drop' />");
        return true;
      })
      .bind('dragend', function(e) {
        return true;
      });
  });
  // Makes pager links refresh the library instead of opening it in the browser window
  $('.pager a', $this).click(function() {
    // At page switching, close all opened BeautyTips.
    $('.editor-item.bt-active').btOff();
    $this.get(0).library_url = this.href;
    $.getJSON(this.href, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call($this.get(0), data, $(editor));
    });
    return false;
  });

  // Turns Views exposed filters' submit button into an ajaxSubmit trigger
  $('.view-filters input[type=submit]', $this).click(function(e) {
    var submit = $(this);
    settings = Drupal.settings.dnd;
    $('.view-filters form', $this).ajaxSubmit({
      'url' : settings.url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = submit.parents('div.dnd-library-wrapper').get(0);
        target.library_url = this.url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      }
    });
    e.preventDefault();
    return false;
  });

  // Makes Views exposed filters' reset button submit the form via ajaxSubmit,
  // without data, to get all the default values back.
  $('.view-filters input[type=reset]', $this).click(function(e) {
    var reset = $(this);
    $('.view-filters form', $this).ajaxSubmit({
      'url' : Drupal.settings.dnd.url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = reset.parents('div.dnd-library-wrapper').get(0);
        target.library_url = Drupal.settings.dnd.url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      },
      'beforeSubmit': function (data, form, options) {
        // Can't use data = [], otherwise we're creating a new array
        // instead of modifying the existing one.
        data.splice(0, data.length);
      }
    });
    e.preventDefault();
    return false;
  });

  // Deals with Views Saved Searches "Save" button
  $('#views-savedsearches-save-search-form input[type=submit]', $this).click(function() {
    var submit = $(this);
    url = submit.parents('div.dnd-library-wrapper').get(0).library_url;
    $('#views-savedsearches-save-search-form', $this).ajaxSubmit({
      'url' : url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = submit.parents('div.dnd-library-wrapper').get(0);
        target.library_url = this.url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      }
    });
    return false;
  });

  // Deals with Views Saved Searches "Delete" button
  $('#views-savedsearches-delete-search-form input[type=submit]', $this).click(function() {
    var submit = $(this);
    $('#views-savedsearches-delete-search-form', $this).ajaxSubmit({
      'url' : settings.url,
      'dataType' : 'json',
      'success' : function(data) {
        var target = submit.parents('div.dnd-library-wrapper').get(0);
        target.library_url = this.url;
        Drupal.behaviors.dndLibrary.renderLibrary.call(target, data, $(editor));
      }
    });
    return false;
  });

  // Deals with Views Saved Searches search links
  $('#views-savedsearches-delete-search-form label a', $this).click(function() {
    // At page switching, close all opened BeautyTips.
    $('.editor-item.bt-active').btOff();
    $this.get(0).library_url = this.href;
    $.getJSON(this.href, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call($this.get(0), data, $(editor));
    });
    return false;
  });

  // Attach all the behaviors to our new HTML fragment
  Drupal.attachBehaviors($this);
},

// Dynamically compose a callback based on the editor name
attach_library: function(e, data) {
  var settings = $.extend({idSelector: Drupal.behaviors.dndLibrary.idSelector}, Drupal.settings.dndDropAreas[data.field]);
  var editor_fn = 'attach_' + data.editor;
  if ($.isFunction(window.Drupal.behaviors.dndLibrary[editor_fn])) {
    window.Drupal.behaviors.dndLibrary[editor_fn](data, settings);
  }
},

// Do garbage collection on detach
detach: function() {
},

// Basic textareas
attach_none: function(data, settings) {
  settings = $.extend({
    targets: $('#'+ data.field),
    processTextAreaClick: function(clicked, representation_id, e, data) {
      var target = this, $target = $(target);

      // Update element count
      Drupal.behaviors.dndLibrary.countElements.call(target, representation_id);

      var atom = Drupal.dnd.Atoms[representation_id];
      var snippet = '<div class="dnd-drop-wrapper">' + atom.editor + '</div>';
      if (atom.meta.legend) {
        snippet += atom.meta.legend;
      }
      $target.replaceSelection(snippet, true);
    }
  }, settings);
  $(settings.drop_selector).dnd(settings);
},

// Attach TinyMCE
attach_tinymce: function(data, settings) {
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
},

idSelector: function(element) {
  if ($(element).is('img')) {
    return $.url.setUrl(element.src).param('dnd_id');
  }
  return false;
},

// Really attach TinyMCE
_attach_tinymce: function(data, settings, tiny_instance) {
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
        $('head', $(this).contents()).append('<style type="text/css">img.drop {width: 0; height: 0;} div.dnd-drop-wrapper {background: #efe; border: 1px #090 solid;}</style>');
        $('body', $(this).contents()).addClass($('body').attr('class'));
        return this;
      });
    },
    processIframeDrop: function(drop, id_selector) {
      var representation_id = id_selector.call(this, drop);
      if (!Drupal.dnd.Atoms[representation_id]) return;
      var representation = Drupal.dnd.Atoms[representation_id].editor;
      var legend = Drupal.dnd.Atoms[representation_id].meta.legend;
      var target = this, $target = $(target), $drop = $(drop), block;

      // Update element count
      Drupal.behaviors.dndLibrary.countElements(target, representation_id);

      // Search through block level parents
      $drop.parents().each(function() {
        var $this = $(this);
        if ($this.css('display') == 'block') {
          block = this;
          $block = $(block);
          return false;
        }
        return true;
      });

      // Remove dropped item
      $drop.remove();

      // If the containing block is now empty after the removal of the dropped
      // item, remove it and switch the containing block to its parent. The
      // goal is to get rid of the <p> that are sometimes inserted around our
      // dropped <img />
      if (block.textContent == '') {
        $tmp = $block.parent();
        $block.remove();
        $block = $tmp;
        block = $block[0];
      }

      // Create an element to insert
      var snippet = '<div class="dnd-drop-wrapper" id="dnd-inserted">' + representation + '</div>';
      if (legend) {
        snippet += legend;
      }

      // The no-parent case
      if ($(block).is('body')) {
        $(block).append(snippet);
      }
      else {
        var old_id = block.id;
        block.id = 'target-block';
        $block = $('#target-block', $target.contents());

        // Add our content after the block
        $block.after(snippet);

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
},

// Keep a counter of times a representation ID has been used
countElements: function(target, representation_id, decrement) {
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
}

/**
 * Refresh the library.
 */
Drupal.dnd.refreshLibraries = function() {
  var settings = Drupal.settings.dndDropAreas;
  for (editor_id in settings) {
    var elem = $("#" + settings[editor_id].library_id).get(0);
    var $editor = $("#" + editor_id);
    $.getJSON(elem.library_url, function (data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(elem, data, $editor);
    });
  }
}
}) (jQuery);
