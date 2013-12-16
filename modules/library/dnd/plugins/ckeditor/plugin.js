(function ($, dnd) {
if (typeof dnd === 'undefined') {
  CKEDITOR.plugins.add('dnd', {});
  return;
}

dnd.atomCut = null;
dnd.atomCurrent = null;
dnd.ckditorWidgetSupport = typeof(CKEDITOR.plugins.registered.widget) != 'undefined';

/**
 * Prevents atom from being edited inside the editor.
 */
dnd.protectAtom = function(element) {
  element
    .attr('contentEditable', false)
    // Allows atom legend to be edited inside the editor.
    .find('.dnd-legend-wrapper').attr('contentEditable', true);
}

dnd.getWrapperElement = function(element) {
  while (element && !(element.type === CKEDITOR.NODE_ELEMENT && element.hasClass('dnd-atom-wrapper'))) {
    element = element.getParent();
  }
  if (element) {
    if (!dnd.ckditorWidgetSupport) {
      this.protectAtom($(element.$));
    }
    this.atomCurrent = element;
  }
  return element;
};

var pluginDefinition = {
  lang: 'en',
  requires: ['dialog', 'menu', 'htmlwriter'],

  init: function (editor) {
    var path = this.path;

    if (dnd.ckditorWidgetSupport) {
      editor.widgets.add('scald_atom', {
        template: '' +
          '<div class="dnd-atom-wrapper">' +
          '<div class="dnd-drop-wrapper"></div>' +
          '<div class="dnd-legend-wrapper"></div>' +
          '</div>',
        editables: {
          legend: {
            selector: '.dnd-legend-wrapper',
            allowedContent: 'div p br b u i em strong a'
          }
        },
        upcast: function(element) {
          return element.hasClass('dnd-atom-wrapper');
        },
        downcast: function(element) {
          console.log(element);
        },
        dialog: 'atomProperties',
        init: function() {
          this.on('dialog', function(evt) {
            console.log(this.element.$);
            evt.data.widget = this;
          }, this);
        }
      });
    }

    editor.on('mode', function (evt) {
      var editor = evt.editor;
      if (editor.mode == 'wysiwyg') {
        editor.document.appendStyleSheet(path + '../../css/editor.css');
        editor.document.appendStyleSheet(path + '../../css/editor-global.css');
        if (!dnd.ckditorWidgetSupport) {
          dnd.protectAtom($(editor.document.$).find('.dnd-atom-wrapper'));
        }

        if (editor && editor.element && editor.element.$ && editor.element.$.attributes['data-dnd-context']) {
          var context = editor.element.$.attributes['data-dnd-context'].value;
          Drupal.settings.dnd.contextDefault = context;
        }
      }
    });

    CKEDITOR.dialog.add('atomProperties', this.path + 'dialogs/' + (dnd.ckditorWidgetSupport ? 'dndwidget.js' : 'dnd.js'));

    editor.addCommand('atomProperties', new CKEDITOR.dialogCommand('atomProperties', {
      allowedContent: 'div[*](*);iframe[*];img(*)'
    }));

    editor.addCommand('atomDelete', {
      exec: function (editor) {
        dnd.atomCurrent.remove();
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    editor.addCommand('atomCut', {
      exec: function (editor) {
        dnd.atomCut = dnd.atomCurrent;
        dnd.atomCurrent.remove();
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    editor.addCommand('atomPaste', {
      exec: function (editor) {
        editor.insertElement(dnd.atomCut);
        dnd.atomCut = null;
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    // Register the toolbar button.
    editor.ui.addButton && editor.ui.addButton('ScaldAtom', {
      label: editor.lang.dnd.atom_properties,
      command: 'atomProperties',
      icon: this.path + 'icons/atom.png'
    });

    editor.on('contentDom', function (evt) {
      editor.document.on('drop', function (evt) {
        var atom = Drupal.dnd.sas2array(evt.data.$.dataTransfer.getData('Text'));
        if (atom && Drupal.dnd.Atoms[atom.sid]) {
          var context = editor.element.$.attributes['data-dnd-context'].value;
          Drupal.dnd.fetchAtom(context, atom.sid, function() {
            var markup = Drupal.theme('scaldEmbed', Drupal.dnd.Atoms[atom.sid], context, atom.options);
            editor.insertElement(CKEDITOR.dom.element.createFromHtml(markup));
          });
          evt.data.preventDefault();
        }
        if (!dnd.ckditorWidgetSupport) {
          dnd.protectAtom($(editor.document.$).find('.dnd-atom-wrapper'));
        }
      });

      editor.document.on('mousedown', function (evt) {
        var element = evt.data.getTarget();
        if (element.is('img')) {
          element = dnd.getWrapperElement(element);
          if (element) {
            evt.cancel();
            //evt.data.preventDefault(true);
          }
        }
      });
    });

    editor.addMenuGroup('dnd');
    editor.addMenuItems({
      atomproperties: {
        label: editor.lang.dnd.atom_properties,
        command: 'atomProperties',
        group: 'dnd'
      },
      atomdelete: {
        label: editor.lang.dnd.atom_delete,
        command: 'atomDelete',
        group: 'dnd'
      },
      atomcut: {
        label: editor.lang.dnd.atom_cut,
        command: 'atomCut',
        group: 'dnd'
      },
      atompaste: {
        label: editor.lang.dnd.atom_paste,
        command: 'atomPaste',
        group: 'dnd'
      }
    });

    editor.contextMenu.addListener(function (element, selection) {
      var menu = {};
      element = dnd.getWrapperElement(element);
      if (element) {
        menu.atomproperties = CKEDITOR.TRISTATE_OFF;
        menu.atomdelete = CKEDITOR.TRISTATE_OFF;
        menu.atomcut = CKEDITOR.TRISTATE_OFF;
      }
      else if (dnd.atomCut) {
        menu.atompaste = CKEDITOR.TRISTATE_OFF;
      }
      return menu;
    });
  },

  afterInit: function (editor) {
  }
}

if (dnd.ckditorWidgetSupport) {
  pluginDefinition.requires.push('widget');
}

CKEDITOR.plugins.add('dnd', pluginDefinition);

})(jQuery, Drupal.dnd);
