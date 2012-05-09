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
      $type->title,
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
  $content = t('
    <h3>Scald Atoms</h3>

    <h4>Currently, there are ' . db_query("SELECT COUNT(*) FROM {scald_atoms}")->fetchCol() . ' Atoms registered with Scald Core.</h4>

    <p>Enable the Views module to get an handy paginated table with filters which will allow you to browse your atoms</p>

  ');

  // @@@TODO: Turn this into a nice little table which gives totals by type and by provider as well as giving the base_description by provider.
  $scald_config = variable_get('scald_config', 0);

  $atoms_results = db_query("
    SELECT
      *
    FROM
      {scald_atom_providers}
    ORDER BY
      type
  ");

  $content .= '<ol>';
  $first = TRUE;
  $current = '';
  while ($atom_raw = db_fetch_array($atoms_results)) {
    if ($current != $atom_raw['type']) {
      $current = $atom_raw['type'];
      if (!$first) {
        $content .= '</ul></li>';
      }
      else {
        $first = FALSE;
      }
      $content .= '
        <li>
          <strong>' . $scald_config->types[$atom_raw['type']]['title'] . '</strong> Atoms are based on:
          <ul>
      ';
    }
    $content .= '<li>' . $atom_raw['base_description'] . ' (Provided by <code>' . $atom_raw['provider'] . '.module</code>)</li>';
  }
  $content .= '</ul></li></ol>';

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
 * The Scald Admin page for Scald Actions
 */
function scald_admin_actions() {
  $content_first = t('
    <h3>Scald Actions</h3>

    <p>Scald Actions are akin to Drupal Permissions.  Each is something which can be done <em>to</em> or <em>with</em> an Atom.  They are assigned to Drupal user roles.  Only roles which have the "use scald" permission can have Actions assigned to them.</p>
  ');

  $content = t('
    <ol>
      <li>
        <strong>Admin Mode</strong>
        <ul>
          <li><em>The Admin Mode Action is not an Action but a characteristic of a Role\'s permitted actions.  If it is given to a Role, that Role\'s Actions will be permitted for <strong>all</strong> Atoms, even if the Actions settings for an Atom indicate that those Actions are not permitted.  Permitting this pseudo-action does <strong>not</strong> grant the Role the ability to administer Scald.  That must be granted through the Drupal User Permissions interface (permission \'adminster scald\').  Assign this pseudo-action with caution as it can lead to licensing violations.</em></li>
          <li>Provided by <code>scald.module</code></li>
        </ul>
      </li>
      <li>
        <strong>Fetch</strong>
        <ul>
          <li><em>The Fetch Action is the an internal Action.  Without this Action permitted, a Role cannot effectively use Scald.  Without this Action permitted for an Atom, that Atom cannot even be loaded, effectively masking it from everyone who does not have Admin Mode permitted.</em></li>
          <li>Provided by <code>scald.module</code></li>
        </ul>
      </li>
  ');

  $actions_results = db_query("
    SELECT
      provider,
      title,
      description
    FROM
      {scald_actions}
  ");
  while ($action_raw = db_fetch_array($actions_results)) {
    $content .= '
      <li>
        <strong>' . $action_raw['title'] . '</strong>
        <ul>
          <li><em>' . $action_raw['description'] . '</em></li>
          <li>Provided by <code>' . $action_raw['provider'] . '.module</code></li>
        </ul>
      </li>
    ';
  }
  $content .= '</ol>';

  return $content_first . drupal_get_form('scald_admin_actions_form') . $content;
} // end scald_admin_actions()



/**
 * Admin form for Scald Actions.
 */
function scald_admin_actions_form() {
  // Pull in the existing settings
  $scald_config = variable_get('scald_config', 0);
  $scald_actions_publisher = variable_get('scald_actions_publisher', 0);


  // Construct the options piece of the form
  $action_options = array();
  foreach ($scald_config->actions as $slug => $details) {
    $action_options[$slug] = $details['title'];
  }


  // The Publisher must be hardcoded in
  $form = array();
  $form['@publisher_set'] = array(
    '#type'         => 'fieldset',
    '#title'        => t('Atom Publisher'),
    '#description'  => t('The Atom Publisher is not a role but is the User who initially registered a given Scald Atom.  Admin Mode is recommended for the Publisher\'s Permitted Actions.'),
    '#collapsible'  => TRUE,
    '#collapsed'    => TRUE,
  );

  $current_actions = array();
  foreach ($scald_config->actions as $slug => $details) {
    if ($scald_actions_publisher & $details['mask']) {
      $current_actions[] = $slug;
    }
  }

  $form['@publisher_set']['@publisher_role'] = array(
    '#type'           => 'checkboxes',
    '#title'          => t('Permitted Actions'),
    '#default_value'  => $current_actions,
    '#options'        => $action_options,
  );


  // Find and add form elements for each Role which has the "use scald" perm
  $roles_results = db_query("
    SELECT
      p.rid,
      p.perm,
      r.name,
      a.actions
    FROM
      {permission} p
    LEFT JOIN
      {role} r
      ON
        r.rid = p.rid
    LEFT JOIN
      {scald_role_actions} a
      ON
        a.rid = p.rid
  ");
  while ($role_raw = db_fetch_array($roles_results)) {
    $perms = explode(', ', $role_raw['perm']);
    if (in_array('use scald', $perms)) {
      $form[$role_raw['rid'] . '_set'] = array(
        '#type'         => 'fieldset',
        '#title'        => $role_raw['name'],
        '#collapsible'  => TRUE,
        '#collapsed'    => TRUE,
      );

      $current_actions = array();
      foreach ($scald_config->actions as $slug => $details) {
        if ($role_raw['actions'] & $details['mask']) {
          $current_actions[] = $slug;
        }
      }

      $form[$role_raw['rid'] . '_set'][$role_raw['rid'] . '_role'] = array(
        '#type'           => 'checkboxes',
        '#title'          => t('Permitted Actions'),
        '#default_value'  => $current_actions,
        '#options'        => $action_options,
      );
    }
  }

  $form['submit'] = array(
    '#type'   => 'submit',
    '#value'  => t('Save'),
  );

  return $form;
} // end scald_admin_actions_form()



/**
 * Submit handler for Scald Actions admin form.
 */
function scald_admin_actions_form_submit($form, &$form_state) {
  $scald_config = variable_get('scald_config', 0);

  // Record what all the bitstrings were *before* the change to determine which
  //  roles changed and minimize the number of users that must be updated.
  $actions_results = db_query("SELECT rid, actions FROM {scald_role_actions}");
  $roles = array();
  while ($actions_raw = db_fetch_array($actions_results)) {
    $roles[$actions_raw['rid']] = $actions_raw['actions'];
  }
  $updated = array();

  // Look for the appropriate form values and update the roles
  foreach ($form_state['values'] as $role => $actions) {
    if (substr($role, -5) == '_role') {
      $role = substr($role, 0, -5);
      $bitstring = 0;
      foreach ($actions as $slug => $set) {
        if (!empty($set)) {
          $bitstring = $bitstring | $scald_config->actions[$slug]['mask'];
        }
      }
      if ($role == '@publisher') {
        variable_set('scald_actions_publisher', $bitstring);
      }
      else {
        if ($bitstring != $roles[$role]) {
          db_query(
            "
              INSERT INTO
                {scald_role_actions}
              SET
                actions = %d,
                rid = %d
              ON DUPLICATE KEY
                UPDATE
                  actions = %d
            ",
            $bitstring,
            $role,
            $bitstring
          );
          // Typecast this to help ensure a direct implode() won't result in SQL
          //  injection
          $updated[] = (int) $role;
        }
      }
    }
  }


  // Update any affected Users
  if (!empty($updated)) {
    batch_set(array(
      'title'             => t('Updating User Actions bitstrings.'),
      'operations'        => array(
        array('scald_admin_actions_batch', array($updated))
      ),
      'progress_message'  => '',  // No message because the batch function provides its own
      'file'              => drupal_get_path('module', 'scald') . '/scald.admin.inc',
    ));
    batch_process('admin/content/scald/actions');
  }
} // end scald_admin_actions_form_submit()



// Callback to handle the mandatory re-saving of all users
function scald_admin_actions_batch($roles, &$context) {
  if (!isset($context['sandbox']['last_uid'])) {
    // Since *all* users have the Authenticated role, it doesn't appear in
    //  {users_roles} and a special case is needed.
    $context['sandbox']['all_users']  = in_array(DRUPAL_AUTHENTICATED_RID, $roles);
    $context['sandbox']['progress']   = 0;
    $context['sandbox']['last_uid']   = 0;
    $context['sandbox']['total']      = db_result(db_query("
      SELECT
        COUNT(DISTINCT uid)
      FROM " .
        ($context['sandbox']['all_users'] ? '{users}' : '{users_roles}') .
      " WHERE " .
        ($context['sandbox']['all_users'] ? "" : "rid IN (" . implode(', ', $roles) . ") AND ") .
      "uid > %d
      ORDER BY
        uid ASC
    "));
  }

  $users_results = db_query_range(
    "
      SELECT
        DISTINCT uid
      FROM " .
        ($context['sandbox']['all_users'] ? '{users}' : '{users_roles}') .
      " WHERE " .
        ($context['sandbox']['all_users'] ? "" : "rid IN (" . implode(', ', $roles) . ") AND ") .
      "uid > %d
      ORDER BY
        uid ASC
    ",
    $context['sandbox']['last_uid'],
    0,
    SCALD_ADMIN_ACTIONS_BATCH_LIMIT
  );
  while ($users_raw = db_fetch_array($users_results)) {
    $current = user_load($users_raw['uid']);
    user_save($current);
    $context['sandbox']['progress']++;
    $context['sandbox']['last_uid'] = $users_raw['uid'];
  }

  $context['message'] = t('Updated @current of @total users.', array('@current' => $context['sandbox']['progress'], '@total' => $context['sandbox']['total']));
  $context['finished'] = $context['sandbox']['progress'] / $context['sandbox']['total'];
} // end scald_admin_actions_batch()

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
