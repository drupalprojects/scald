(function ($, dnd) {
var atomCut = null, atomCurrent = null;

dnd.getWrapperElement = function(element) {
  while (element && !(element.type === CKEDITOR.NODE_ELEMENT && element.hasClass('dnd-atom-wrapper'))) {
    element = element.getParent();
  }
  if (element) {
    atomCurrent = element;
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

    editor.addCommand('atomDelete', {
      exec: function (editor) {
        atomCurrent.remove();
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    editor.addCommand('atomCut', {
      exec: function (editor) {
        atomCut = atomCurrent;
        atomCurrent.remove();
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    editor.addCommand('atomPaste', {
      exec: function (editor) {
        editor.insertElement(atomCut);
        atomCut = null;
      },
      canUndo: false,
      editorFocus: CKEDITOR.env.ie || CKEDITOR.env.webkit
    });

    editor.on('contentDom', function (evt) {
      editor.document.on('click', function (evt) {
        if (element = dnd.getWrapperElement(evt.data.getTarget())) {
          // fancy stuffs
        }
      });

      editor.document.on('mousedown', function (evt) {
        var element = evt.data.getTarget();
        if (element.is('img')) {
          var element = dnd.getWrapperElement(element);
          if (element) {
            evt.data.preventDefault(true);
          }
        }
      });
    });

    editor.addMenuGroup('dnd');
    editor.addMenuItems({
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
      var type, conf, menu = {};
      element = dnd.getWrapperElement(element);
      if (element) {
        menu.atomdelete = CKEDITOR.TRISTATE_ON;
        menu.atomcut = CKEDITOR.TRISTATE_ON;
      }
      else if (atomCut) {
        menu.atompaste = CKEDITOR.TRISTATE_ON;
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

