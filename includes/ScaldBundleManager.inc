<?php
/**
 * @file
 * Bundle Manager class.
 */

class ScaldBundleManager {

  /**
   * Add a new bundle.
   *
   * @param array $values
   *   Array of the following keys:
   *   - bundle
   *   - type
   *   - providers
   *   - title
   *   - description
   *   - disabled
   *
   * @return bool
   *
   * @throws Exception
   */
  public static function addBundle($values) {
    if (self::loadBundle($values->bundle)) {
      throw new Exception('Bundle with that machine name exists.');
    }

    ctools_include('export');
    $bundle = ctools_export_new_object('scald_atom_bundle');

    foreach ($values as $key => $value) {
      $bundle->$key = $value;
    }
    self::saveBundle($bundle);

    field_attach_create_bundle('scald_atom', $bundle->bundle);
  }

  /**
   * Load bundle.
   */
  public static function loadBundle($machine_name) {
    ctools_include('export');
    return ctools_export_crud_load('scald_atom_bundle', $machine_name);
  }

  /**
   * Save bundle.
   */
  public static function saveBundle($bundle) {
    ctools_include('export');
    return ctools_export_crud_save('scald_atom_bundle', $bundle);
  }

  /**
   * Delete bundle.
   */
  public static function deleteBundle($bundle) {
    // Check if there are atoms in this bundle.
    $count = db_query("SELECT COUNT(*) FROM {scald_atoms} WHERE type = :bundle", array(':bundle' => $bundle->bundle))->fetchField();
    if ($count) {
      throw new Exception('Atoms present in the bundle.');
    }

    ctools_include('export');
    ctools_export_crud_delete('scald_atom_bundle', $bundle);

    field_attach_delete_bundle('scald_atom', $bundle->bundle);
  }

  /**
   * Attach fields into a bundle.
   *
   * @param $machine_name
   *
   * @return bool
   */
  public static function attachFields($machine_name) {
    // Start with the Scald thumbnail field.
    $instance = array(
      'field_name' => 'scald_thumbnail',
      'entity_type' => 'scald_atom',
      'bundle' => $machine_name,
      'label' => 'Thumbnail',
      'required' => FALSE,
      'display' => array(
        'default' => array(
          'type' => 'hidden',
        ),
      ),
      'settings' => array(
        'file_directory' => 'thumbnails/' . $machine_name,
      ),
    );

    if (!field_read_instance($instance['entity_type'], $instance['field_name'], $instance['bundle'])) {
      field_create_instance($instance);
      $instance = field_info_instance($instance['entity_type'], $instance['field_name'], $instance['bundle']);
      foreach ($instance['display'] as $view_mode => $settings) {
        $instance['display'][$view_mode]['type'] = 'hidden';
      }
      field_update_instance($instance);
    }

    // Instantiate the Scald Authors field.
    $instance = array(
      'field_name' => 'scald_authors',
      'entity_type' => 'scald_atom',
      'bundle' => $machine_name,
      'label' => 'Authors',
      'required' => FALSE,
      'widget' => array(
        'type' => 'taxonomy_autocomplete',
      ),
    );
    if (!field_read_instance($instance['entity_type'], $instance['field_name'], $instance['bundle'])) {
      field_create_instance($instance);
    }

    // Instantiate the Scald Tags field.
    $instance = array(
      'field_name' => 'scald_tags',
      'entity_type' => 'scald_atom',
      'bundle' => $machine_name,
      'label' => 'Tags',
      'required' => FALSE,
      'widget' => array(
        'type' => 'taxonomy_autocomplete',
      ),
    );
    if (!field_read_instance($instance['entity_type'], $instance['field_name'], $instance['bundle'])) {
      field_create_instance($instance);
    }

    // Flush our caches.
    scald_contexts(TRUE);

    return TRUE;
  }
}
