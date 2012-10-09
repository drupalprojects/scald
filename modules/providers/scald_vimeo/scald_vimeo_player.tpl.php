<?php
/**
 * @file
 *   Default theme implementation for Scald Vimeo player.
 */
?>
<object width="<?php print $vars['video_width'] ?>" height="<?php print $vars['video_height'] ?>" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">
  <param name="movie" value="http://vimeo.com/moogaloop.swf?clip_id=<?php print $vars['video_id'] ?>&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1&amp;autoplay=0&amp;loop=0"></param>
  <param name="allowFullScreen" value="true"></param>
  <param name="allowScriptAccess" value="always"></param>
  <param name="wmode" value="transparent"></param>
  <object data="http://vimeo.com/moogaloop.swf?clip_id=<?php print $vars['video_id'] ?>&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=0&amp;show_portrait=0&amp;color=00ADEF&amp;fullscreen=1&amp;autoplay=0&amp;loop=0" type="application/x-shockwave-flash" width="<?php print $vars['video_width'] ?>" height="<?php print $vars['video_height'] ?>" allowfullscreen="true" allowscriptaccess="always" wmode="transparent">
    <img src="<?php print $vars['thumbnail'] ?>" alt="" class="dnd-dropped" width="<?php print $vars['video_width'] ?>" />
  </object>
</object>
