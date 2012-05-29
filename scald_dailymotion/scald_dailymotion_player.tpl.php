<?php
/**
 */
?>
<object width="480" height="365" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">
  <param name="movie" value="http://www.dailymotion.com/swf/<?php print $video; ?>&related=0"></param>
  <param name="allowFullScreen" value="true"></param>
  <param name="allowScriptAccess" value="always"></param>
  <param name="wmode" value="transparent"></param>
  <object data="http://www.dailymotion.com/swf/<?php print $video; ?>&related=0" type="application/x-shockwave-flash" width="480" height="365" allowfullscreen="true" allowscriptaccess="always" wmode="transparent">
    <img src="<?php print $thumbnail; ?>" alt="" class="dnd-dropped" width="480" />
  </object>
</object>
