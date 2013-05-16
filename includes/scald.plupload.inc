<?php
/**
 * @file
 * Plupload integration helper functions.
 */

/**
 * Creates a file object at the proper place when uploading with plupload.
 */
function scald_plupload_save_file($tmppath, $target) {
  $tmp = plupload_file_uri_to_object($tmppath);
  // changing file mime to the proper one
  $tmp->filemime = file_get_mimetype($target);
  $tmp->status = 0;
  return file_move($tmp, $target, FILE_EXISTS_RENAME);
}

