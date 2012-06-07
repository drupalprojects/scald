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

  $content = t('
    <h3>Scald Providers</h3>

    <p>The following Scald Providers are registered with Scald Core.  To force a Provider to renew its registration (this is useful if a Provider conditionally provides something such as a Transcoder based on whether or not a module is availble and you have just enabled new modules) click the <em>re-register</em> link next to the Provider\'s name.</p>
  ');

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
  // @@@TODO: Make this into a *useful* UI!
  $form['defaults']['type_' . $type_name . '_actin'] = array(
    '#type'           => 'textfield',
    '#title'          => t('Default Actions bitstring'),
    '#description'    => t('Should be an integer.  Note that the numbering on the Actions Admin page does not correspond to bit order.'),
    '#default_value'  => $default->actions,
    '#size'           => 10,
    '#maxlength'      => 24,
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
          $scald_atom_defaults[$type]->actions = (int) $value;
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
  $content = t('
    <h3>Scald Atoms</h3>

    <ul class="action-links">
      <li>!add_link</li>
    </ul>

    <h4>Currently, there are @count Atoms registered with Scald Core.</h4>

    <p>Enable the Views module to get an handy paginated table with filters which will allow you to browse your atoms</p>
  ', array('!add_link' => l('Add atom', 'atoms/add'), '@count' => $count)
  );


  return $content;
} // end scald_admin_atoms()



/**
 * The Scald Admin page for Scald Contexts.
 */
function scald_admin_contexts($type) {
  $output[] = t('
    <h3>Scald Rendering Contexts</h3>
    <br>
    <p>Scald Rendering Contexts are something like themes for Scald Atoms.  Any Atom can be rendered in any Context and the Context determines what that rendering looks like and what language it is in.</p>
    <p>If a Context is "parseable", that means that its output is wrapped in HTML comments (currently this feature only works reliably for Contexts which have a render language of XHTML) which make it possible for Scald Core to uniquely identify the Atom based on the rendering.  For instance, if a WYSIWYG editor is being used in some text areas and Scald Atoms should be included in the WYSIWYG preview of the text, a Context can be chosen and specified as parseable.  That ensures that when the textarea is submitted, Scald Core will be able to determine which Atoms are present in the textarea, convert the rendered versions to Scald Atom Shorthand and ensure proper parsing by the Scald Atom Shorthand Input Filter.</p>
  ');


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
      '#default_  value' => 'bla'
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
            ))
            ->updateFields(array('transcoder' => $transcoder))
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
 * The Scald Admin page for Scald Transcoders
 *
 * The Transcoders and their descriptions are simply listed; no configuration
 *  changes can be made from this page.
 */
function scald_admin_transcoders() {
  $content = t('
    <h3>Scald Transcoders</h3>
    <br>
    <p>Scald Transcoders take the files associated with Atoms of a particular Type and transcode them into a file format which is appropriate for output.  Any configuration for the Transcoders should be completed on the settings page for the Providing module.</p>
    <ol>
      <li>
        <strong>Passthrough</strong>
        <ul>
          <li><em>The Passthrough Transcoder simply makes the source file available to the rendering stack in an unmodified form.</em></li>
          <li>Provided by <code>scald.module</code></li>
        </ul>
      </li>
  ');

  $transcoders_results = db_query("
    SELECT
      *
    FROM
      {scald_transcoders}
  ");
  while ($transcoder_raw = db_fetch_array($transcoders_results)) {
    $content .= '
      <li>
        <strong>' . $transcoder_raw['title'] . '</strong>
        <ul>
          <li><em>' . $transcoder_raw['description'] . '</em></li>
          <li>Provided by <code>' . $transcoder_raw['provider'] . '.module</code></li>
        </ul>
      </li>
    ';
  }
  $content .= '</ol>';

  return $content;
} // end scald_admin_transcoders()



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
    '#title' => 'Always rebuild rendered content',
    '#description' => "By default, Scald tries to agressively cache the atom's
      rendered content, by context and by actions available to the user viewing
      it. Checking this box, Scald will re-render the atom each time. This is a
      massive performance hit."
  );
  return system_settings_form($form);
}
