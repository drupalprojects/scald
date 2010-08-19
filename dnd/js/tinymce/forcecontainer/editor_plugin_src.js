/**
 * $Id$
 *
 * A plugin to handle forcing a selection to an outer container with a given
 * class.
 *
 * Options
 *
 * forcecontainer_class:  
 *
 *   Elements with this class will be forced to the outer container on certain 
 *   events.
 *
 * forcecontainer_trigger_dnd:
 *   
 *   Custom option -- enables triggering of a custom event via jQuery for the
 *   Drag and Drop Library.
 */

(function() {
	var Event = tinymce.dom.Event;

	tinymce.create('tinymce.plugins.ForceContainerPlugin', {
		getInfo : function() {
			return {
				longname : 'Force an element to its outer container',
				author : 'David Eads',
				authorurl : 'http://invisibleinstitute.com/eads',
				infourl : '',
				version : tinymce.majorVersion + "." + tinymce.minorVersion
			};
		},

		init : function(ed, url) {
			var t = this, forceContainerClass;

			t.editor = ed;
			forceContainerClass = ed.getParam("forcecontainer_class", "mceForceContainer");

			ed.onNodeChange.addToTop(function(ed, cm, n) {
				var sc, ec, c;

				// Block if start or end is inside a non editable element
				sc = ed.dom.getParent(ed.selection.getStart(), function(n) {
					return ed.dom.hasClass(n, forceContainerClass) && !ed.dom.hasClass(n, 'force-container-processed');
				});

				ec = ed.dom.getParent(ed.selection.getEnd(), function(n) {
					return ed.dom.hasClass(n, forceContainerClass) && !ed.dom.hasClass(n, 'force-container-processed');
				});

				// Block or unblock
				if (sc || ec) {
          c = sc ? sc : ec;
          ed.selection.select(c);
					t._setDisabled(1);
					return false;
				} else
					t._setDisabled(0);
			});
		},

		_block : function(ed, e) {
			var k = e.keyCode, s = ed.selection, n = s.getNode(), reparent, forceContainerClass;

      // Reparent node 
      forceContainerClass = ed.getParam("forcecontainer_class", "mceForceContainer");

      // Block if start or end is inside a non editable element
      sc = ed.dom.getParent(ed.selection.getStart(), function(n) {
        return ed.dom.hasClass(n, forceContainerClass) && !ed.dom.hasClass(n, 'force-container-processed');
      });

      ec = ed.dom.getParent(ed.selection.getEnd(), function(n) {
        return ed.dom.hasClass(n, forceContainerClass) && !ed.dom.hasClass(n, 'force-container-processed');
      });

      if (sc || ec) {
        n = (sc) ? sc : ec;
      }

      // Pass F1-F12, alt, ctrl, shift, page up, page down, arrow keys
      if ((k > 111 && k < 124) || k == 16 || k == 17 || k == 18 || k == 27 || (k > 32 && k < 41)) {
        return;
      }
      
      // Step out to parent and delete
      if (k == 8 || k == 46) {
			  if (ed.getParam("forcecontainer_trigger_dnd", false)) {
          // @TODO -- this is getting called twice!!!
          $('#' + ed.id + '-wrapper iframe').trigger('dnd_delete', { 'node' : n });
        }
        ed.execCommand('Delete', false, null);
      }

      // Typing some common characters 
      if (k == 13 || (k > 47 && k < 91) || (k > 95 && k < 112) || (k > 185 && k < 223)) {
        var c = ed.dom.get('__caret'), p;
        if (!c) {
          p = ed.dom.create('p', {}, ((k != 13) ? String.fromCharCode(k) : '') + '<span id="__caret">_</span>');
          ed.dom.insertAfter(p, n);
          s.select(c);
        } else {
          s.select(c);
          ed.execCommand('Delete', false, null);
        }
      }
      
			return Event.cancel(e);
		},


		_setDisabled : function(s) {
			var t = this, ed = t.editor, n = t.container;

			tinymce.each(ed.controlManager.controls, function(c) {
        c.setDisabled(s);
			});

			if (s !== t.disabled) {
				if (s) {
					ed.onClick.addToTop(t._block);
					ed.onMouseDown.addToTop(t._block);
					ed.onKeyDown.addToTop(t._block);
					ed.onKeyPress.addToTop(t._block);
					ed.onKeyUp.addToTop(t._block);
					ed.onPaste.addToTop(t._block);
				} else {
					ed.onClick.remove(t._block); // @TODO causing buggy behavior if you click twice
					ed.onMouseDown.remove(t._block);
					ed.onKeyDown.remove(t._block);
					ed.onKeyPress.remove(t._block);
					ed.onKeyUp.remove(t._block);
					ed.onPaste.remove(t._block);
				}

				t.disabled = s;
			}
		}
	});

	// Register plugin
	tinymce.PluginManager.add('forcecontainer', tinymce.plugins.ForceContainerPlugin);
})();
