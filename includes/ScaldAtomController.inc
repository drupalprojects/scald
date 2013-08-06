<?php
/**
 * @file
 * This file contains the Scald Atom controller.
 */

/**
 * Controller class for Scald Atoms.
 *
 * This extends DrupalDefaultEntityController, adding special handling
 * for ScaldAtom objects.
 */
class ScaldAtomController extends DrupalDefaultEntityController {
  /**
   * Overrides DrupalDefaultEntityController::attachLoad().
   */
  protected function attachLoad(&$atoms, $revision_id = FALSE) {
    foreach ($atoms as $atom) {
      $atom->data = unserialize($atom->data);
    }

    parent::attachLoad($atoms, $revision_id);
  }

  /**
   * Prepares and returns the default thumbnail path for an atom type.
   */
  public static function getThumbnailPath($type) {
    $field = field_info_field('scald_thumbnail');
    $instance = field_info_instance('scald_atom', 'scald_thumbnail', $type);
    if ($field && $instance) {
      $directory = file_field_widget_uri($field, $instance);
      if (file_prepare_directory($directory, FILE_CREATE_DIRECTORY)) {
        return $directory;
      }
    }

    // If there is no scald_thumbnail field, return the old image atom path, which
    // is probably the only atom type that asks for thumbnail path even when there
    // is no thumbnail field.
    $directory = 'public://atoms/images';
    if (file_prepare_directory($directory, FILE_CREATE_DIRECTORY)) {
      return $directory;
    }
  }
}
