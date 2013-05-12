<?php

/**
 * @file
 * Hooks related to Scald atoms and providers.
 *
 * SCALD HOOK EXECUTION STACK
 * ==========================
 *
 * The order in which the hooks execute can be fairly important. Each hook
 * might add more information to the Atom object or potentially even remove
 * some. Knowing when a given hook fires relative to others is important. Note
 * that each hook will be called for each module that implements it in turn.
 * The order in which the module's hooks are called is determined by their
 * relative weight in the {system} table.
 *
 * The following illustrate when each of the various hooks are called relative
 * to one another. Keep in mind that there is often prior and intervening code
 * which could have a significant impact on the contents of $atom or the other
 * variables being passed to the hooks.
 *
 *
 * system_modules_submit() [The form at /admin/build/modules is submitted]
 *   -> {provider}_install() [Drupal hook]
 *   -> {provider}_enable() [Drupal hook]
 *   -> {provider}_scald_provider()
 *
 * scald_render()
 *   -> scald_fetch()
 *     -> {type_provider}_scald_fetch($mode = 'type')
 *     -> {atom_provider}_scald_fetch($mode = 'atom')
 *   -> scald_prerender()
 *     -> {type_provider}_scald_prerender($mode = 'type')
 *     -> {atom_provider}_scald_prerender($mode = 'atom')
 *     -> {transcoder_provider}_scald_prerender($mode = 'transcoder')
 *     -> {context_provider}_scald_prerender($mode = 'context')
 *   -> {context_provider}_scald_render()
 *
 * scald_register_atom(), scald_update_atom(), scald_unregister_atom()
 *   -> {type_provider}_scald_fetch($mode = 'type')
 *   -> {atom_provider}_scald_fetch($mode = 'atom')
 *   -> {relationship_provider}_scald_prerender($mode = 'relationship')
 *   -> {transcoder_provider}_scald_prerender($mode = 'transcoder')
 *
 * scald_rendered_to_sas()
 *   -> scald_rendered_to_sas_LANGUAGE()
 */

/**
 * Define information about atom providers provided by a module.
 *
 * @return
 *   An array of atom providers. This array is keyed on the unified atom type.
 *   A module can define at most one provider for each atom type. Each provider
 *   is defined by a untranslated name.
 */
function hook_scald_atom_providers() {
  return array(
    'image' => 'Image hosted on Flickr',
  );

  // This code will never be hit, but is necessary to mark the string
  // for translation on localize.d.o
  t('Image hosted on Flickr');
}

/**
 * Define information about atom players provided by a module.
 *
 * @return
 *   An array of atom players. This array is keyed on the machine-readable
 *   player name. Each player is defined as an associative array containing the
 *   following items:
 *   - "name": The untranslated human-readable name of the player.
 *   - "description": The longer description of the player.
 *   - "type": The type array that is compatible with the player. The special
 *     value '*' means this player is compatible with all atom types.
 *   - "settings": The default settings array.
 */
function hook_scald_player() {
  return array(
    'html5' => array(
      'name' => 'HTML5 player',
      'description' => 'The HTML5 player for images and videos.',
      'type' => array('image', 'video'),
      'settings' => array(
        'classes' => '',
        'caption' => '[atom:title], by [atom:author]',
      ),
    ),
  );
}

/**
 * Settings form for player.
 *
 * It is not a really hook. Only one module is invoke.
 *
 * @param $form
 *
 * @param $form_state
 *
 * $form_state['scald'] contains atom type, context and player value.
 */
function hook_scald_player_settings_form($form, &$form_state) {
}

/**
 * Respond to atom insertion.
 *
 * It is not a really hook. Only one module is invoke. This function is a direct
 * port from Drupal 6 version of Scald. It is similar to hook_field_insert in
 * Drupal 7.
 *
 * @param $atom
 *   The atom being created.
 *
 * @param $mode
 *   Role of the callee function. Can have the following values:
 *   - "type" (not really, as we don't have type provider now)
 *   - "atom"
 *   - "transcoder"
 */
function hook_scald_register_atom($atom, $mode) {
}

/**
 * Respond to atom update.
 *
 * Similar to hook_scald_register_atom(), but this hook is invoked for existing
 * atoms.
 *
 * @param $atom
 *   The atom being created.
 *
 * @param $mode
 *   Role of the callee function. Can have the following values:
 *   - "type" (not really, as we don't have type provider now)
 *   - "atom"
 *   - "transcoder"
 *
 * @see hook_scald_register_atom().
 */
function hook_scald_update_atom($atom, $mode) {
}

/**
 * Respond to atom deletion.
 *
 * @param $atom
 *   The atom being created.
 *
 * @param $mode
 *   Role of the callee function. Can have the following values:
 *   - "type" (not really, as we don't have type provider now)
 *   - "atom"
 *   - "transcoder"
 *
 * @see hook_scald_register_atom().
 */
function hook_scald_unregister_atom($atom, $mode) {
}

/**
 * Respond to atom fetch (load).
 *
 * @param $atom
 *   The atom being created.
 *
 * @param $mode
 *   Role of the callee function. Can have the following values:
 *   - "type" (not really, as we don't have type provider now)
 *   - "atom"
 *
 * @see hook_scald_register_atom().
 */
function hook_scald_fetch($atom, $mode) {
  if ($mode == 'atom') {
    $atom->description = 'description';
    $atom->source_file = 'source path';
    $atom->thumbnail_file = 'thumbnail path';
    // Typically, for Atom Providers which are based on Drupal nodes, the $node
    // object is attached to the $atom as the base_entity member.
    $atom->base_entity = node_load($atom->sid);
  }
}

/**
 * Respond to atom actions.
 *
 * This hook is not yet implemented.
 */
function hook_scald_action($atom, $action, $mode) {
}

/**
 * Respond to atom prerender.
 *
 * @param $atom
 *   The atom being created.
 *
 * @param $mode
 *   Role of the callee function. Can have the following values:
 *   - "type" (not really, as we don't have type provider now)
 *   - "atom"
 *   - "transcoder"
 *   - "context"
 *   - "player"
 *
 */
function hook_scald_prerender($atom, $context, $options, $mode) {
}

/**
 * Respond to atom render.
 *
 * It is not a really hook. Only one module is invoke.
 *
 * @param $atom
 *   The atom being rendered.
 *
 * @param $context
 *   The context used to render.
 *
 * @param $options
 *   The options which is a string in JSON format.
 */
function hook_scald_render($atom, $context, $options) {
}

/**
 * Handles the render options when it is not a JSON string.
 *
 * In the old version of Scald, $options could be a simple string. But modern
 * implementation requires it is a JSON string to interact with $options as an
 * array. This hook give modules a change to convert that simple string into an
 * array.
 *
 * @param array $options
 *   The $options array to be updated. The original options string is stored at
 *   $options['option'].
 *
 * @param ScaldAtom $atom
 *   The atom used in render.
 *
 * @param string $context
 *   The context used in render.
 */
function hook_scald_render_options_alter(&$options, &$atom, &$context) {
}

/**
 * Convert from a rendered format to SAS.
 */
function hook_scald_rendered_to_sas_LANGUAGE($text) {
}

/**
 * Alters contexts available in the wysiwyg editor, per atom type.
 *
 * Allows modules to modify the context list that will be available to choose
 * from in the wysiwyg editor's "Edit atom properties" dialog.
 */
function hook_scald_wysiwyg_context_list_alter(&$contexts) {
  unset($contexts['image']['Library_representation']);
  $contexts['image']['sdl_editor_representation'] = t('Default');
}

/**
 * @defgroup scald_atom_provider Hooks related to Atom provider modules.
 * @{
 * Theses hooks are implemented by the Atom provider modules.
 *
 * Only module that is declared as provider for the atom is invoked.
 */

/**
 * Provides a form using to add an atom.
 *
 * @param array $form
 *
 * @param array $form_state
 */
function hook_scald_add_form(&$form, &$form_state) {
  $defaults = scald_atom_defaults('image');
  $form['file'] = array(
    '#type' => $defaults->upload_type,
    '#title' => t('Image'),
    '#upload_location' => 'public://atoms/images/',
    '#upload_validators' => array('file_validate_extensions' => array('jpg jpeg png gif')),
  );
}

/**
 * Provides number of atoms available when a form is submitted.
 *
 * Some widgets are able to create multiple atoms at a time. This hook is
 * usually used to check number of atoms available in a form. If a provider does
 * not support multiple atom creation, return 1.
 *
 * @param array $form
 *
 * @param array $form_state
 */
function hook_scald_add_atom_count(&$form, &$form_state) {
  if (is_array($form_state['values']['file'])) {
    return max(count($form_state['values']['file']), 1);
  }
  return 1;
}

/**
 * Fills default atom data.
 *
 * When a form is uploaded, one or more atoms are created, but it is not saved.
 * This is a last chance for atom provider to add default data, maybe from the
 * form, into atoms.
 *
 * @param array $atoms
 *
 * @param array $form
 *
 * @param array $form_state
 */
function scald_image_scald_add_form_fill(&$atoms, $form, $form_state) {
  foreach ($atoms as $delta => $atom) {
    if (is_array($form_state['values']['file']) && module_exists('plupload')) {
      module_load_include('inc', 'scald', 'includes/scald.plupload');
      $file = scald_plupload_save_file($form_state['values']['file'][$delta]['tmppath'], $form['file']['#upload_location'] . $form_state['values']['file'][$delta]['name']);
    }
    else {
      $file = file_load($form_state['values']['file']);
    }
    $atom->title = $file->filename;
    $atom->base_id = $file->fid;
    $atom->scald_thumbnail[LANGUAGE_NONE][0] = (array)$file;
  }
}

/**
 * @} End of "defgroup scald_atom_provider".
 */

