(function ($, dnd) {
if (typeof dnd === 'undefined') {
  CKEDITOR.plugins.add('dnd', {});
  return;
}

dnd.atomCut = null;
dnd.atomCurrent = null;
dnd.getWrapperElement = function(element) {
  while (element && !(element.type === CKEDITOR.NODE_ELEMENT && element.hasClass('dnd-atom-wrapper'))) {
    element = element.getParent();
  }
  if (element) {
    this.atomCurrent = element;
  }
  return element;
}

CKEDITOR.plugins.add('dnd', {
  lang: 'en',
  requires: 'dialog,menu,htmlwriter',

  onLoad: function() {
  },

  init: function (editor) {
    var path = this.path;
    editor.on('instanceReady', function (evt) {
      var editor = evt.editor;
      editor.document.appendStyleSheet(path + '../../css/editor.css');
    });

    CKEDITOR.dialog.add('atomProperties', this.path + 'dialogs/dnd.js' );

    var command = editor.addCommand('atomProperties', new CKEDITOR.dialogCommand('atomProperties'));

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

    editor.on('contentDom', function (evt) {
      editor.document.on('click', function (evt) {
        if (element = dnd.getWrapperElement(evt.data.getTarget())) {
        }
      });

      editor.document.on('mousedown', function (evt) {
        var element = evt.data.getTarget();
        if (element.is('img')) {
          var element = dnd.getWrapperElement(element);
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

    editor.on('paste', function (evt) {
    });
  },

  afterInit: function (editor) {
  }
});
})(jQuery, Drupal.dnd);

