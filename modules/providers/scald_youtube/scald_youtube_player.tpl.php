<?php
/**
 * @file
 *   Default theme implementation for the Scald Youtube Player
 */
?>
<object width="<?php print $vars['video_width'] ?>" height="<?php print $vars['video_height'] ?>" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">
  <param name="movie" value="http://www.youtube.com/v/<?php print $vars['video_id'] ?>&related=0"></param>
  <param name="allowFullScreen" value="true"></param>
  <param name="allowScriptAccess" value="always"></param>
  <param name="wmode" value="transparent"></param>
  <object data="http://www.youtube.com/v/<?php print $vars['video_id']; ?>&related=0" type="application/x-shockwave-flash" width="<?php print $vars['video_width'] ?>" height="<?php print $vars['video_height'] ?>" allowfullscreen="true" allowscriptaccess="always" wmode="transparent">
    <img src="<?php print $vars['thumbnail'] ?>" alt="" class="dnd-dropped" width="<?php print $vars['video_width'] ?>" />
  </object>
</object>
