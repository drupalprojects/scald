/**
 * Drag and Drop Library For Drupal
 *
 * This builds on the DnD jQuery plugin written to provide drag and drop media
 * handling to Rich Text Editors to consume, display, and attach behavior to
 * a "media library" provided via JSON and implemented for Drupal running
 * the Wysiwyg plugin.
 */

(function($, Drupal) {
/**
 * Initialize our namespace.
 */
Drupal.dnd = {
  Atoms: {
  },

  // Keep track of the last focused textarea.
  lastFocus: null,

  // Setting for the qTip v2 library
  qTipSettings: {
    position: {
      my: 'right center',
      at: 'left center'
    },
    hide: {
      fixed: true,
      delay: 200
    },
    show: {
      solo: true
    },
    style: {
      classes: 'ui-tooltip-scald-dnd'
    }
  },

  // Additional settings for the deprecated qTip v1
  qTip1Settings: {
    position: {
      corner: {
        target: 'leftMiddle',
        tooltip: 'rightMiddle'
      }
    },
    style: {
      width: 550,
      classes: {tooltip: 'ui-tooltip-scald-dnd'}
    }
  },

  /**
   * Fetch atoms that are not present.
   *
   * @param context
   * @param atom_ids
   *   Integer or an array of atom_id.
   * @param callback (optional)
   *   Callback when all required atoms are available.
   */
  fetchAtom: function(context, atom_ids, callback) {
    // Convert to array
    atom_ids = [].concat(atom_ids);

    for (var i= 0, len=atom_ids.length; i<len; i++) {
      // Remove atom from the list if it is already available.
      if ((atom_ids[i] in Drupal.dnd.Atoms) && (context in Drupal.dnd.Atoms[atom_ids[i]].contexts)) {
        delete atom_ids[i];
      }
    }

    // Remove undefined elements.
    atom_ids = atom_ids.filter(Number);

    if (atom_ids.length) {
      $.getJSON(Drupal.settings.basePath + 'atom/fetch/' + atom_ids.join() + '?context=' + context, function(data) {
        for (var atom_id in data) {
          if (Drupal.dnd.Atoms[atom_id]) {
            // Merge old data into the new return atom.
            $.extend(true, Drupal.dnd.Atoms[atom_id], data[atom_id]);
          }
          else {
            Drupal.dnd.Atoms[atom_id] = data[atom_id];
          }
        }
        if (callback) {
          callback();
        }
      });
    }
    else {
      if (callback) {
        callback();
      }
    }
  },

  // Refresh the library.
  refreshLibraries: function() {
    $('.dnd-library-wrapper .view-filters').find('input[type=submit], button[type=submit]').click();
  },

  // Convert HTML to SAS. We consider there is no nested elements.
  html2sas: function(text) {
    text = text.replace(/<!-- (scald=(\d+):([a-z_]+)) -->[\r\n\s\S]*?<!-- END scald=\2 -->/g, '[$1]');
    return text;
  },

  // Convert SAS to HTML.
  // @todo Known bug: we have to fetch atoms that are not present in the current
  // scope of Drupal.dnd.Atoms
  sas2html: function(text) {
    for (var i in Drupal.dnd.Atoms) {
      var atom = Drupal.dnd.Atoms[i];
      if (text.indexOf(atom.sas) > -1) {
        text = text.replace(atom.sas, atom.editor);
      }
    }
    return text;
  },

  // Convert SAS to an array of atom attributes.
  sas2array: function(sas) {
    var matches = sas.match(/\[scald=(\d+)(:([^\s]+))?(.*)]/);
    if (matches.length) {
      return {
        sid: matches[1],
        context: matches[3],
        options: matches[4]
      };
    }
  },

  /**
   * Insert text at the caret in a textarea.
   */
  insertText: function(txtArea, textValue) {
    //IE
    if (document.selection) {
      txtArea.focus();
      var sel = document.selection.createRange();
      sel.text = textValue;
    }
    //Firefox, chrome, mozilla
    else if (txtArea.selectionStart || txtArea.selectionStart == '0') {
      var startPos = txtArea.selectionStart;
      var endPos = txtArea.selectionEnd;
      txtArea.value = txtArea.value.substring(0, startPos) + textValue + txtArea.value.substring(endPos, txtArea.value.length);
      txtArea.focus();
      txtArea.selectionStart = startPos + textValue.length;
      txtArea.selectionEnd = startPos + textValue.length;
    }
    else {
      txtArea.value += textArea.value;
      txtArea.focus();
    }
    return true;
  },

  /**
   * Insert an atom in the current RTE or textarea.
   */
  insertAtom: function(sid) {
    var cke = Drupal.ckeditorInstance;
    if (cke) {
      var markup = Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[sid]);
      cke.insertElement(CKEDITOR.dom.element.createFromHtml(markup));
    }
    else if (Drupal.dnd.lastFocus) {
      var markup = Drupal.dnd.Atoms[sid].sas;
      Drupal.dnd.insertText(Drupal.dnd.lastFocus, markup);
    }
    return true;
  }
};

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
Drupal.theme.prototype.scaldEmbed = function(atom, context, options) {
  context = context ? context : Drupal.settings.dnd.contextDefault;

  var classname = 'dnd-atom-wrapper';
  classname += ' type-' + atom.meta.type;
  classname += ' context-' + context;
  if (atom.meta.align && atom.meta.align != 'none') {
    classname += ' atom-align-' + atom.meta.align;
  }

  var output = '<div class="' + classname + '"><div class="dnd-drop-wrapper">' + atom.contexts[context] + '</div>';
  if (atom.meta.legend) {
    output += '<div class="dnd-legend-wrapper">' + atom.meta.legend + '</div>';
  }
  output += '</div>';

  // If there are options, update the SAS representation.
  if (options) {
    output = output.replace(/<!-- scald=\d+(.+?) -->/, '<!-- scald=' + atom.sid + ':' + context + ' ' + JSON.stringify(options) + ' -->');
  }

  return output;
};

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

  $('body').once('dnd', function() {
    var wrapper = $('<div class="dnd-library-wrapper"></div>').appendTo('body');
    var $editor = $("<a />");
    wrapper.library_url = Drupal.settings.dnd.url;
    $.getJSON(wrapper.library_url, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(wrapper, data, $editor);
    });
  });

  // Track the last focused textarea or textfield.
  $('textarea, .form-type-textfield input').focus(function(){
    Drupal.dnd.lastFocus = this;
    Drupal.ckeditorInstance = false;
  });
},

renderLibrary: function(data, editor) {
  var library_wrapper = $(this);

  // Save the current status
  var dndStatus = {
    search: library_wrapper.find('.scald-menu').hasClass('search-on'),
    library: library_wrapper.hasClass('library-on')
  };

  library_wrapper.html(data.menu + data.anchor + data.library);
  var scald_menu = library_wrapper.find('.scald-menu');

  // Rearrange some element for better logic and easier theming.
  // @todo We'd better do it on server side.
  scald_menu
    .prepend(library_wrapper.find('.summary'))
    .append(library_wrapper.find('.view-filters').addClass('filters'));
  if (dndStatus.search) {
    scald_menu.addClass('search-on');
    library_wrapper.addClass('library-on');
  }
  library_wrapper.find('.summary .toggle').click(function() {
    // We toggle class only when animation finishes to avoid flash back.
    scald_menu.animate({left: scald_menu.hasClass('search-on') ? '-42px' : '-256px'}, function() {
      $(this).toggleClass('search-on');
    });
    // When display search, we certainly want to display the library, too.
    if (!scald_menu.hasClass('search-on') && !library_wrapper.hasClass('library-on')) {
      $('.scald-anchor').click();
    }
  });
  library_wrapper.find('.scald-anchor').click(function() {
    // We toggle class only when animation finishes to avoid flash back.
    library_wrapper.animate({right: library_wrapper.hasClass('library-on') ? '-276px' : '0'}, function() {
      library_wrapper.toggleClass('library-on');
    });
  });

  for (var atom_id in data.atoms) {
    // Store the atom data in our object
    Drupal.dnd.Atoms[atom_id] = Drupal.dnd.Atoms[atom_id] || {sid: atom_id};
    Drupal.dnd.Atoms[atom_id].contexts = Drupal.dnd.Atoms[atom_id].contexts || {};
    $.extend(true, Drupal.dnd.Atoms[atom_id], data.atoms[atom_id]);
    Drupal.dnd.Atoms[atom_id].contexts[Drupal.settings.dnd.contextDefault] = Drupal.dnd.Atoms[atom_id].editor;

    // And add a nice preview behavior if qTip is present
    if ($.prototype.qtip) {
      var settings = $.extend(Drupal.dnd.qTipSettings, {
        content: {
          text: Drupal.dnd.Atoms[atom_id].preview
        }
      });

      // When using the deprecated qTip v1 library,
      // add some additional settings.
      try {
        $.fn.qtip.styles.defaults.width.min;
        $.extend(settings, Drupal.dnd.qTip1Settings);
      }
      catch(err) {
        // On qTip 2, everything's ok
      }

      $("#sdl-" + atom_id).qtip(settings);
    }
  }

  // Preload images in editor representations
  var cached = $.data($(editor), 'dnd_preload') || {};
  for (var editor_id in Drupal.dnd.Atoms) {
    if (!cached[editor_id]) {
      var $representation = $(Drupal.dnd.Atoms[editor_id].editor);
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
  $('.editor-item ._insert a').each(function(i) {
    $(this)
      .bind('click', function(e) {
        e.preventDefault();
        return Drupal.dnd.insertAtom($(this).data('atom-id'));
      });
  });
  $('.editor-item .drop').each(function(i) {
    $(this)
      .bind('dblclick', function(e) {
        return Drupal.dnd.insertAtom($(this).data('atom-id'));
      })
      .bind('dragstart', function(e) {
        var dt = e.originalEvent.dataTransfer, id = e.target.id, $this = $(this);
        var $img;
        if ($this.is('img')) {
          $img = $this;
        }
        else {
          $this.find('img');
        }
        var id = $img.data('atom-id');
        dt.dropEffect = 'copy';
        dt.setData("Text", Drupal.dnd.Atoms[id].sas);
        try {
          // Trick: if not the image might come out and go into the current hovered
          // paragraph.
          var markup = '<p>&nbsp;</p>' + Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[id]);
          dt.setData("text/html", markup);
        }
        catch(e) {
        }
        return true;
      })
      .bind('dragend', function(e) {
        return true;
      });
  });
  // Makes pager links refresh the library instead of opening it in the browser window
  library_wrapper.find('.pager a').click(function() {
    library_wrapper.get(0).library_url = this.href;
    $.getJSON(this.href, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(library_wrapper.get(0), data, $(editor));
    });
    return false;
  });

  // Turns Views exposed filters' submit button into an ajaxSubmit trigger
  library_wrapper.find('.view-filters').find('input[type=submit], button[type=submit]').click(function(e) {
    var submit = $(this);
    settings = Drupal.settings.dnd;
    library_wrapper.find('.view-filters form').ajaxSubmit({
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
  library_wrapper.find('.view-filters').find('input[type=reset], button[type=reset]').click(function(e) {
    var reset = $(this);
    library_wrapper.find('.view-filters form').ajaxSubmit({
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
  library_wrapper.find('#views-savedsearches-save-search-form').find('input[type=submit], button[type=submit]').click(function() {
    var submit = $(this);
    var url = submit.parents('div.dnd-library-wrapper').get(0).library_url;
    library_wrapper.find('#views-savedsearches-save-search-form').ajaxSubmit({
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
  library_wrapper.find('#views-savedsearches-delete-search-form').find('input[type=submit], button[type=submit]').click(function() {
    var submit = $(this);
    library_wrapper.find('#views-savedsearches-delete-search-form').ajaxSubmit({
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
  library_wrapper.find('#views-savedsearches-delete-search-form label a').click(function() {
    library_wrapper.get(0).library_url = this.href;
    $.getJSON(this.href, function(data) {
      Drupal.behaviors.dndLibrary.renderLibrary.call(library_wrapper.get(0), data, $(editor));
    });
    return false;
  });

  // Attach all the behaviors to our new HTML fragment
  Drupal.attachBehaviors(library_wrapper);
}
}

}) (jQuery, Drupal);
