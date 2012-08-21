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
 * Default atom theme function
 */
Drupal.theme.prototype.scaldEmbed = function(atom) {
  var output = '<div class="dnd-atom-wrapper"><div class="dnd-drop-wrapper">' + atom.editor + '</div>';
  if (atom.meta.legend) {
    output += '<div class="dnd-legend-wrapper">' + atom.meta.legend + '</div>';
  }
  output += '</div>';

  // Trick: if not the image might come out and go into the current hovered
  // paragraph.
  output = '<p>&nbsp;</p>' + output;

  return output;
}

/**
 * Initialize and load drag and drop library and pass off rendering and
 * behavior attachment.
 */
Drupal.behaviors.dndLibrary = {
attach: function(context, settings) {
  if (Drupal.settings.dnd.suppress) {
    return;
  }

  Drupal.ajax.prototype.commands.dnd_refresh = Drupal.dnd.refreshLibraries;

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
        dt.setData('Text', Drupal.dnd.Atoms[id].sas);
        dt.setData('text/html', Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[id]));
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

// Do garbage collection on detach
detach: function() {
},

idSelector: function(element) {//@todo unused
  if ($(element).is('img')) {
    return $.url.setUrl(element.src).param('dnd_id');
  }
  return false;
}
}

// Refresh the library.
Drupal.dnd.refreshLibraries = function() {
  $('.dnd-library-wrapper .view-filters input[type=submit]').click();
};

// Convert HTML to SAS. We consider there is no nested elements.
Drupal.dnd.html2sas = function(text) {
  text = text.replace(/<!-- (scald=(\d+):([a-z_]+)) -->[\r\n\s\S]*<!-- END scald=\2 -->/g, '[$1]');
  return text;
};

// Convert SAS to HTML
// @todo Known bug: we have to fetch atoms that are not present in
// the current scope of Drupal.dnd.Atoms
Drupal.dnd.sas2html = function(text) {
  for (var i in Drupal.dnd.Atoms) {
    atom = Drupal.dnd.Atoms[i];
    if (text.indexOf(atom.sas) > -1) {
      text = text.replace(atom.sas, atom.editor);
    }
  }
  return text;
};

}) (jQuery);

