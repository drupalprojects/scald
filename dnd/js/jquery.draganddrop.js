/**
 * jQuery Drag and Drop Library for Rich Editors
 *
 * A helper library which provides the ability to drag and drop images to Rich 
 * Text Editors (RTEs) that use the embedded iframe + DesignMode method. DnD
 * also provides a simple "clicky" interface for inserting the same markup 
 * directly into a textarea.  
 *
 * Basic usage:
 *
 * $('img.my-draggable-class').dnd({targets: $('#my-rte-iframe')});
 *
 * Options:
 *
 * targets (Required):
 *   A jQuery object corresponding to the proper iframe(s) and/or textarea(s)
 *   that are allowed drop targets for the current set of elements.
 *
 * idSelector:
 *  A callback that parses out the unique ID of an image that is dropped in an 
 *  iframe.  While some browsers (such as Firefox and Internet Explorer) allow
 *  markup to be copied when dragging and dropping, Safari (and assumably
 *  other webkit based browsers) don't.  The upshot is that the safest bet is
 *  to parse the element's src URL.  Because querystrings seem to drop 
 *  consistently across browsers, encoding the id in a query string is a good
 *  option.
 *
 * processIframeDrop:
 *   A callback that defines the mechanism for inserting and rendering the 
 *   dropped item in an iframe.  The typical usage pattern I expect to see is
 *   that implementers will listen for their RTE to load and then invoke DnD
 *   with a processIframeDrop appropriate to their editor.  For performance
 *   reasons, this only runs once per invocation of DnD -- to compensate, we 
 *   must pass in an idselector callback as an argument. 
 *
 * processTextAreaClick:
 *   A callback that defines the mechanism for inserting and rendering the
 *   clicked item in a textarea.  The default function just tries to insert
 *   some markup at the caret location in the current textarea.
 *
 * iframeTargetClass:
 *   A class to add to a draggable item if it can be dragged to an iframe.
 *
 * textareaTargetClass:
 *   A class to add to a draggable item if it can be dragged to a textarea.
 *
 * processedClass:
 *   A class to add to draggable items processed by DnD.
 *
 * droppedClass:
 *   A class to add to images that are dropped (by default, this is used to
 *   ensure that a successful drop manifests the editor representation only
 *   once.)
 *
 * interval:
 *   How often to check the iframe for a drop, in milliseconds.
 *
 * Usage notes:
 *
 * Due to cross browser flakiness, there are many many limitations on what is
 * possible in terms of dragging and dropping to DesignMode enabled iframes.
 *
 * To make this work, your "droppable" elements must be image tags.  No ifs, ands, 
 * or buts:  image tags have the best cross browser behavior when dragging.
 *
 * When DnD is invoked, it begins a timer which periodically checks your 
 * editor iframe.  If an image is dropped in, DnD takes the element and 
 * attempts to parse it for a unique ID which you can use to do a lookup for 
 * an "editor representation."  If an editor representation is found, 
 * typically the image is replaced with the representation snippet, but you are
 * free to do whatever you want.
 *
 * Because of browser limitations, the safest way to parse the element is to
 * look at the img's src attribute and use some or all of the image URL. 
 * In my experience, the best way to deal with this is simply to parse out
 * generate a query string in the src attribute server side that corresponds 
 * to the proper representation ID.
 *
 * If the target is not an iframe but a textarea, DnD provides a very minimal
 * system for clicking what would otherwise be dragged to insert markup into 
 * the textarea.
 *
 * Because DnD spawns so many timers, they are stored in a $.data element 
 * attached to the parent document body.  Implementers should consider clearing
 * the timers when building systems such as dynamic searches or paging 
 * functionality to ensure memory usage and performance remains stable.
 */

(function($) {
  $.fn.dnd = function(opt) {
    opt = $.extend({}, {
      interval: 250,
      targets: $('iframe, textarea'),
      processTargets: function(targets) {
        return targets.each(function() {
          $('head', $(this).contents()).append('<style type="text/css">img { display: none; } img.dnd-dropped {display: block; }</style>');
          return this;
        });
      },
      idSelector: function(element) { 
        if ($(element).is('img')) {
          return element.src;
        }
        return false;
      }, 
      processIframeDrop: function(drop, id_selector) {
        var representation_id = opt.idSelector(drop);
        $(drop).replaceWith(representation_id).wrap('<p class="'+ opt.droppedClass +'"></p>');
      },
      processTextAreaClick: function(target, clicked, representation_id) {
        var snippet = '<div><img src="'+ representation_id +'" /></div>';
        $(target).replaceSelection(snippet, true);
        e.preventDefault();
      },
      processIframeClick: function (target, clicked, representation_id) { return true; },

      iframeTargetClass: 'dnd-iframe-target',
      textareaTargetClass: 'dnd-textarea-target',
      processedClass: 'dnd-processed',
      droppedClass: 'dnd-dropped'

    }, opt);

    // Initialize plugin
    var targets = opt.processTargets(opt.targets);

    // Watch iframes for changes
    $(targets).filter('iframe').each(function() {
      var target = this; 
      var t = setInterval(function() {              
        var ifr = $(target)[0];
        // Check that jQuery .contents() can work, and return early otherwise.
        if (!ifr.contentDocument && !ifr.contentWindow) {
          return;
        }
        $('img:not(.'+ opt.droppedClass +')', $(target).contents()).each(function() {
          opt.processIframeDrop.call(target, this, opt.idSelector);
          var data = {'drop': this, 'representation_id': opt.idSelector(this)};

          // Trigger event in container window
          $(target).trigger('dnd_drop', data);

          // Trigger event in iframe
          $(this).trigger('dnd_drop', data);
        });
      }, opt.interval);

      // Track current active timers -- developers working with DnD
      // can implement their own garbage collection for specific 
      // interactions, such as paging or live search.
      var data = $(document).data('dnd_timers');
      if (!data) { data = {}; }
      data[target.id] = t;
      $(document).data('dnd_timers', data);
    });

    // Process each draggable element
    return this.each(function() {
      if ($(this).is('img')) {
        var element = this, $element = $(element);
        var representation_id = opt.idSelector(element);

        if (!representation_id) {
          return this;
        };

        // Add a special class
        $(element).addClass(opt.processedClass);

        // Data for custom event
        var event_data = {'drop': element, 'representation_id': representation_id};

        // We need to differentiate behavior based on the targets
        targets.each(function() {
          var target = this, $target = $(target);
          if ($target.is('iframe')) {
            $(element).addClass(opt.iframeTargetClass);
            $(element).click(function() {
              opt.processIframeClick.call(target, element, representation_id);
              $(target).trigger('dnd_drop', event_data);
            });
          } else if ($target.is('textarea')) {
            $(element).addClass(opt.textareaTargetClass);
            $(element).click(function() {
              opt.processTextAreaClick.call(target, element, representation_id);
              $(target).trigger('dnd_drop', event_data);
            });
          }
        });
      }
    });
  };
})(jQuery);
