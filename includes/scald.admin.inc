<?php

/**
 * @file
 * Scald Admin
 *
 * The Scald Core Admin Interface
 *
 * @ingroup scald
 */

require_once('scald.constants.inc');

/**
 * The Scald Admin Dashboard.
 *
 * @return
 *  The Dashboard rendered in XHTML.
 */
function scald_admin_dashboard() {
  $types = scald_types();

  $content = '<h3>' . t('Scald Providers') . '</h3>';
  $content .= '<p>' . t('The following Scald Providers are registered with Scald Core.  To force a Provider to renew its registration (this is useful if a Provider conditionally provides something such as a Transcoder based on whether or not a module is availble and you have just enabled new modules) click the <em>re-register</em> link next to the Provider\'s name.') . '</p>';

  $list = array('type' => 'ul', 'items' => array());
  $table = array(
    'header' =>  array(
      t('Name'),
      array(
        'data' => t('Actions'),
        'colspan' => 4
      )
    ),
    'rows' => array(),
  );

  foreach ($types as $type) {
    $table['rows'][] = array(
      check_plain($type->title),
      l(t('edit'), 'admin/structure/scald/' . $type->type),
      l(t('manage fields'), 'admin/structure/scald/' . $type->type . '/fields'),
      l(t('manage display'), 'admin/structure/scald/' . $type->type . '/display'),
      l(t('contexts'), 'admin/structure/scald/' . $type->type . '/contexts'),
    );
  }

  $content .= theme('table', $table);

  // Prepare a list of contexts.
  $contexts = scald_contexts();

  $content .= '<h3>' . t('Scald Contexts') . '</h3>';
  $content .= '<p>' . t('List of all Scald Contexts, thoses created through the UI and even those hidden or defined by other modules.') . '</p>';

  $list = array('type' => 'ul', 'items' => array());
  $table = array(
    'header' =>  array(
      t('Context name'),
      t('Atom type'),
      t('Property'),
      t('Actions'),
    ),
    'rows' => array(),
  );

  foreach (scald_contexts() as $name => $context) {
    $table['rows'][] = array(
      check_plain($context['title']) . '<div class="description">' . filter_xss_admin($context['description']) . '</div>',
      empty($context['formats']) ? '<em>' . t('not specified') . '</em>' : check_plain(implode(', ', array_keys($context['formats']))),
      // @todo add more when the UI created context comes
      empty($context['hidden']) ? '' : t('hidden'),
      // @todo add more when the UI created context comes
      '',
    );
  }

  $content .= theme('table', $table);

  return $content;
} // end scald_admin_dashboard()


/**
 * Form for admin settings for Scald Types
 */
function scald_admin_type_form($form, $form_state, $type) {
  $form = array();
  $type_name = $type->type;
  $type_raw = (array)$type;
  $form['type_' . $type_name . '_title'] = array(
    '#type'           => 'textfield',
    '#title'          => t('Title'),
    '#default_value'  => $type_raw['title'],
    '#size'           => 40,
    '#maxlength'      => 255,
    '#required'       => TRUE,
  );

  $default = scald_atom_defaults($type_name);

  $form['defaults'] = array(
    '#type'         => 'fieldset',
    '#title'        => t('Defaults'),
    '#description'  => t('Every Atom must have certain data associated with it.  If an Atom Provider fails to supply that data, these defaults are used.  If nothing is specified here, Scald Core will supply generic defaults.'),
    '#collapsible'  => FALSE,
  );
  $form['defaults']['type_' . $type_name. '_thumb'] = array(
    '#type'           => 'textfield',
    '#title'          => t('Default Thumbnail Image'),
    '#description'    => t('Specify a path relative to the Drupal install directory.  This image file will be automatically resized and transcoded as appropriate when generating the actual thumbnail image.'),
    '#default_value'  => $default->thumbnail_source,
    '#size'           => 40,
    '#maxlength'      => 255,
    '#required'       => TRUE,
  );
  $form['defaults']['type_' . $type_name . '_descr'] = array(
    '#type'           => 'textfield',
    '#title'          => t('Default Description'),
    '#description'    => t('Empty strings are permitted.'),
    '#default_value'  => $default->description,
    '#size'           => 40,
    '#maxlength'      => 255,
    '#required'       => TRUE,
  );
  // Create checkboxes for the defined actions
  $actions = scald_actions();
  $options = array();
  $options_default = array();
  foreach ($actions as $name => $action) {
    $options[$name] = $action['title'];
    $options_default[$name] = $default->actions & $action['bitmask'] ? $name : '';
  }
  $form['defaults']['type_' . $type_name . '_actin'] = array(
    '#type'           => 'checkboxes',
    '#title'          => t('Default Actions'),
    '#description'    => t('Please select the actions that should be enabled by default for atom of this type. Note that the actions you choose here are the one that you want to be made available on this atom to everyone ; the actions that the atom author can perform can be configured per role using standard Drupal rights.'),
    '#options'        => $options,
    '#default_value'  => $options_default,
    '#required'       => TRUE,
  );

  $form['atom_type'] = array(
    '#type' => 'value',
    '#value' => $type_name
  );

  $form['submit'] = array(
    '#type'   => 'submit',
    '#value'  => t('Save'),
  );

  return $form;
} // end scald_admin_types_form()

/**
 * Submist function for admin settings for Scald Types.
 *
 * Updated values are written directly back to the database and then the Scald
 *  Configuration Object is rebuilt from the db.
 */
function scald_admin_type_form_submit($form, &$form_state) {
  $scald_atom_defaults = variable_get('scald_atom_defaults', array());
  $type = $form_state['values']['atom_type'];

  if (empty($scald_atom_defaults[$type])) {
    $scald_atom_defaults[$type] = new stdClass();
  }


  foreach ($form_state['values'] as $key => $value) {
    if (substr($key, 0, 5) == 'type_') {
      switch (substr($key, -6)) {
        case '_title':
          db_update('scald_types')
            ->fields(array('title' => $value))
            ->condition('type', $type)
            ->execute();
          break; // end '_title'

        case '_thumb':
          $scald_atom_defaults[$type]->thumbnail_source = $value;
          break; // end '_thumb'

        case '_descr':
          $scald_atom_defaults[$type]->description = $value;
          break; // end '_descr'

        case '_actin':
          $actions = scald_actions();
          $bitmask = 0;
          foreach ($actions as $name => $action) {
            if (!empty($value[$name])) {
              $bitmask |= $action['bitmask'];
            }
          }
          $scald_atom_defaults[$type]->actions = $bitmask;
          break; // end '_actin'
      }
    }
  }

  drupal_set_message(t('Atom settings changed'));
  variable_set('scald_atom_defaults', $scald_atom_defaults);
  scald_types(TRUE);
} // end scald_admin_types_form_submit()



/**
 * The Scald Admin page for Scald Atoms.
 */
function scald_admin_atoms() {
  $count = db_query("SELECT COUNT(*) FROM {scald_atoms}")->fetchField();
  $content = '<h3>' . t('Scald Atoms') . '</h3>';
  $content .= '<ul class="action-links"><li>' . l(t('Add atom'), 'atoms/add') . '</li></ul>';
  $content .= '<h4>' . format_plural($count, 'Currently, there is 1 atom registered with Scald Core.', 'Currently, there are @count atoms registered with Scald Core.') . '</h4>';
  $content .= '<p>' . t('Enable the Views module to get an handy paginated table with filters which will allow you to browse your atoms.') . '</p>';

  return $content;
} // end scald_admin_atoms()

/**
 * The Scald Admin page for Scald Contexts.
 */
function scald_admin_contexts($type) {
  $content = '<h3>' . t('Scald Rendering Contexts') . '</h3>';
  $content .= '<p>' . t('Scald Rendering Contexts are something like themes for Scald Atoms.  Any Atom can be rendered in any Context and the Context determines what that rendering looks like and what language it is in.') . '</p>';
  $content .= '<p>' . t('If a Context is "parseable", that means that its output is wrapped in HTML comments (currently this feature only works reliably for Contexts which have a render language of XHTML) which make it possible for Scald Core to uniquely identify the Atom based on the rendering.  For instance, if a WYSIWYG editor is being used in some text areas and Scald Atoms should be included in the WYSIWYG preview of the text, a Context can be chosen and specified as parseable.  That ensures that when the textarea is submitted, Scald Core will be able to determine which Atoms are present in the textarea, convert the rendered versions to Scald Atom Shorthand and ensure proper parsing by the Scald Atom Shorthand Input Filter.') . '</p>';

  $output[] = $content;
  $output[] = drupal_get_form('scald_admin_contexts_form', $type);

  return $output;
} // end scald_admin_contexts()

/**
 * Form for admin settings for Scald Contexts.
 */
function scald_admin_contexts_form($form, $form_state, $type) {
  $form = array();

  $contexts = scald_contexts();
  $transcoders = scald_transcoders();
  $transcoder_options = array();
  foreach ($transcoders as $tname => $transcoder) {
    $transcoder_options[$tname] = $transcoder['title'];

  }

  foreach ($contexts as $name => $context) {
    // Only list visible contexts
    if (!empty($context['hidden'])) {
      continue;
    }

    $default = !empty($contexts[$name]['type_format'][$type->type]['transcoder']) ? $contexts[$name]['type_format'][$type->type]['transcoder'] : NULL;
    $form[$name] = array(
      '#type'         => 'fieldset',
      '#title'        => $context['title'],
      '#description'  => $context['description'] . '<br>' . t('Provided by <code>@module.module</code>.', array('@module' => $context['provider'])),
      '#collapsible'  => TRUE,
      '#collapsed'    => TRUE,
    );
    $form[$name][$name . '_parse'] = array(
      '#type'           => 'checkbox',
      '#title'          => t('Make parseable.'),
      '#default_value'  => (bool) $context['parseable'],
      '#disabled'       => TRUE,
    );

    $form[$name][$name . '_trans'] = array(
      '#type'            => 'select',
      '#title'           => t('Transcoder'),
      '#options'         => $transcoder_options,
      '#default_value'   => $default,
    );

  }

  $form['submit'] = array(
    '#type'   => 'submit',
    '#value'  => t('Save'),
  );

  return $form;
} // end scald_admin_contexts_form()



/**
 * Submit handler for Scald Contexts admin settings form.
 *
 * Updated values are written directly back to the database and then the Scald
 *  Configuration Object is rebuilt from the db.
 */
function scald_admin_contexts_form_submit($form, &$form_state) {
  drupal_set_message(t('Context transcoders settings saved'));
  $typename = $form_state['build_info']['args'][0]->type;
  foreach ($form_state['values'] as $key => $value) {
    switch (substr($key, -6)) {
      // Transcoders
      case '_trans':
        $context = substr($key, 0, -6);
        $transcoder = $value;
        if ($value == '@none') {
          db_delete('scald_context_type_transcoder')
            ->condition('context', $context)
            ->condition('type', $typename)
            ->execute();
        }
        else {
          db_merge('scald_context_type_transcoder')
            ->fields(array(
              'file_format' => 'jpg',
              'transcoder' => $transcoder,
            ))
            ->key(array(
              'context' => $context,
              'type' => $typename
            ))
            ->execute();
        }
        break; // end '_trans'
    }
  }

  // The transcoders associated to the contexts might have change. In this case,
  // all the output that we keep in the cache is invalid, which means that we'll
  // need to regenerate it.
  cache_clear_all('*', 'cache_scald', TRUE);

} // end scald_admin_contexts_form_submit()

/**
 * Generates Scald admin settings form.
 */
function scald_settings_form() {
  $form = array();
  $form['intro'] = array(
    '#value' => t("
      <h3>Scald Settings</h3>
      <p>Below you'll find some general Scald settings. Beware that some of
      them are very useful for debugging, but may completely kill performance.
      Use with caution.</p>
    ")
  );
  $form['scald_always_rebuild'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('scald_always_rebuild', FALSE),
    '#title' => t('Always rebuild rendered content'),
    '#description' => t('By default, Scald tries to agressively cache the atom\'s rendered content, by context and by actions available to the user viewing it. Checking this box, Scald will re-render the atom each time. This is a massive performance hit.'),
  );

  // Scald tags vocabulary
  $options = array();
  $vocabularies = taxonomy_get_vocabularies();
  foreach($vocabularies as $vid => $vocabulary) {
    $options[$vid] = $vocabulary->name;
  }
  $form['scald_tags_vocabulary'] = array(
    '#type' => 'select',
    '#title' => t('Vocabulary used for tags storing'),
    '#description' => t('By default, Scald uses its own vocabulary to store atoms tags, you can override it here.'),
    '#options' => $options,
    '#default_value' => variable_get('scald_tags_vocabulary', 0), 
  );

  // Add our custom submit handler
  $form['#submit'][] = 'scald_settings_form_submit';

  return system_settings_form($form);
}


function scald_settings_form_submit($form, &$form_state) {
  // Find the selected vocabulary
  $vocabularies = taxonomy_get_vocabularies();
  $vocabulary = $vocabularies[$form_state['values']['scald_tags_vocabulary']];

  // Fetch info on the scald_tags taxonomy reference field
  $field = field_info_field('scald_tags');

  // Change the vocabulary used for this field
  $field['settings']['allowed_values'][0]['vocabulary'] = $vocabulary->machine_name;
  field_update_field($field);
}

