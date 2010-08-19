<?php
/* $Id$ */

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
  $scald_providers = variable_get('scald_providers', array());

  $content = '
    <h3>Scald Providers</h3>

    <p>The following Scald Providers are registered with Scald Core.  To force a Provider to renew its registration (this is useful if a Provider conditionally provides something such as a Transcoder based on whether or not a module is availble and you have just enabled new modules) click the <em>re-register</em> link next to the Provider\'s name.</p>
    <ul>
  ';

  foreach ($scald_providers as $provider) {
    $content .= '<li>' . $provider . '.module [' . l('re-register', 'admin/content/scald/register/' . $provider) . ']</li>';
  }

  $content .= '</ul>';

  return $content;
} // end scald_admin_dashboard()



/**
 * Forces a Scald Provider to re-register with Scald Core, potentially
 *  previously-unknown Provisions.
 *
 * @return
 *  None.  Forwards to Admin Dashboard.
 */
function scald_admin_provider_reregister($provider) {
  if (_scald_register_provider($provider, module_invoke($provider, 'scald_provider'), TRUE)) {
    drupal_set_message(t('Successfuly re-registered Scald Provider %provider', array('%provider' => $provider . '.module')));
  }
  else {
    drupal_set_message(t('Re-registering Scald Provider %provider failed.', array('%provider' => $provider . '.module')), 'error');
  }

  scald_config_rebuild();
  drupal_goto('admin/content/scald');
} // end scald_admin_provider_reregister()



/**
 * The Scald Admin page for Scald Unified Types.
 */
function scald_admin_types() {
  $scald_config = variable_get('scald_config', 0);

  $content = '
    <h3>Scald Unified Types</h3>
    <br>
    <p>Scald Unified Types are a way of dealing with various different media *formats* in a uniform manner.  For instance, from the average user\'s perspective, a JPEG and a PNG are pretty much the same thing.  Both could be classified as the Scald Unified Type "Image".</p>
    <p>When users interact with Atoms, they will often see the title of the Type of Atom.  That title can be customized below.  Be sure to specify the title in the singular, not plural, form.</p>
  ';

  return $content . drupal_get_form('scald_admin_types_form');
} // end scald_admin_types()



/**
 * Form for admin settings for Scald Types
 */
function scald_admin_types_form() {
  $form = array();

  $types_results = db_query("
    SELECT
      *
    FROM
      {scald_types}
  ");
  while ($type_raw = db_fetch_array($types_results)) {
    $form[$type_raw['type']] = array(
      '#type'         => 'fieldset',
      '#title'        => $type_raw['title'],
      '#description'  => $type_raw['description'] . '<br>' . t('Provided by <code>@module.module</code>', array('@module' => $type_raw['provider'])),
      '#collapsible'  => TRUE,
      '#collapsed'    => TRUE,
    );
    $form[$type_raw['type']]['type_' . $type_raw['type'] . '_title'] = array(
      '#type'           => 'textfield',
      '#title'          => t('Title'),
      '#default_value'  => $type_raw['title'],
      '#size'           => 40,
      '#maxlength'      => 255,
      '#required'       => TRUE,
    );
    $scald_config = variable_get('scald_config', 0);
    $scald_atom_defaults = variable_get('scald_atom_defaults', 0);
    $form[$type_raw['type']]['defaults'] = array(
      '#type'         => 'fieldset',
      '#title'        => t('Defaults'),
      '#description'  => t('Every Atom must have certain data associated with it.  If an Atom Provider fails to supply that data, these defaults are used.  If nothing is specified here, Scald Core will supply generic defaults.'),
      '#collapsible'  => FALSE,
    );
    $form[$type_raw['type']]['defaults']['type_' . $type_raw['type'] . '_thumb'] = array(
      '#type'           => 'textfield',
      '#title'          => t('Default Thumbnail Image'),
      '#description'    => t('Specify a path relative to the Drupal install directory.  This image file will be automatically resized and transcoded as appropriate when generating the actual thumbnail image.'),
      '#default_value'  => $scald_atom_defaults->thumbnail_source[$type_raw['type']],
      '#size'           => 40,
      '#maxlength'      => 255,
      '#required'       => TRUE,
    );
    $form[$type_raw['type']]['defaults']['type_' . $type_raw['type'] . '_descr'] = array(
      '#type'           => 'textfield',
      '#title'          => t('Default Description'),
      '#description'    => t('Empty strings are permitted.'),
      '#default_value'  => $scald_atom_defaults->description[$type_raw['type']],
      '#size'           => 40,
      '#maxlength'      => 255,
      '#required'       => TRUE,
    );
    // @@@TODO: Make this into a *useful* UI!
    $form[$type_raw['type']]['defaults']['type_' . $type_raw['type'] . '_actin'] = array(
      '#type'           => 'textfield',
      '#title'          => t('Default Actions bitstring'),
      '#description'    => t('Should be an integer.  Note that the numbering on the Actions Admin page does not correspond to bit order.'),
      '#default_value'  => $scald_atom_defaults->actions[$type_raw['type']],
      '#size'           => 10,
      '#maxlength'      => 24,
      '#required'       => TRUE,
    );
  }

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
function scald_admin_types_form_submit($form, &$form_state) {
  $scald_atom_defaults = variable_get('scald_atom_defaults', 0);

  foreach ($form_state['values'] as $key => $value) {
    if (substr($key, 0, 5) == 'type_') {
      $type = substr($key, 5, -6);
      switch (substr($key, -6)) {
        case '_title':
          db_query(
            "
              UPDATE
                {scald_types}
              SET
                title = '%s'
              WHERE
                type = '%s'
            ",
            $value,
            $type
          );
          break; // end '_title'

        case '_thumb':
          $scald_atom_defaults->thumbnail_source[$type] = $value;
          break; // end '_thumb'

        case '_descr':
          $scald_atom_defaults->description[$type] = $value;
          break; // end '_descr'

        case '_actin':
          $scald_atom_defaults->actions[$type] = (int) $value;
          break; // end '_actin'
      }
    }
  }

  variable_set('scald_atom_defaults', $scald_atom_defaults);
  scald_config_rebuild('types');
} // end scald_admin_types_form_submit()



/**
 * The Scald Admin page for Scald Atoms.
 */
function scald_admin_atoms() {
  $content = '
    <h3>Scald Atoms</h3>

    <h4>Currently, there are ' . db_result(db_query("SELECT COUNT(*) FROM {scald_atoms}")) . ' Atoms registered with Scald Core.</h4>

    <p>Once Views integration is complete, there will be a handy paginated table with filters which will allow the Admin to perform various actions on the Atoms.

  ';

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
function scald_admin_contexts() {
  $scald_config = variable_get('scald_config', 0);

  $content = '
    <h3>Scald Rendering Contexts</h3>
    <br>
    <p>Scald Rendering Contexts are something like themes for Scald Atoms.  Any Atom can be rendered in any Context and the Context determines what that rendering looks like and what language it is in.</p>
    <p>If a Context is "parseable", that means that its output is wrapped in HTML comments (currently this feature only works reliably for Contexts which have a render language of XHTML) which make it possible for Scald Core to uniquely identify the Atom based on the rendering.  For instance, if a WYSIWYG editor is being used in some text areas and Scald Atoms should be included in the WYSIWYG preview of the text, a Context can be chosen and specified as parseable.  That ensures that when the textarea is submitted, Scald Core will be able to determine which Atoms are present in the textarea, convert the rendered versions to Scald Atom Shorthand and ensure proper parsing by the Scald Atom Shorthand Input Filter.</p>
  ';


  return $content . drupal_get_form('scald_admin_contexts_form');
} // end scald_admin_contexts()



/**
 * Form for admin settings for Scald Contexts.
 */
function scald_admin_contexts_form() {
  $form = array();

  $scald_config = variable_get('scald_config', 0);

 // Build the Context editing form per-context
  $contexts_results = db_query("
    SELECT
      c.*
    FROM
      {scald_contexts} c
    ORDER BY
      c.title
  ");
  while ($context_raw = db_fetch_array($contexts_results)) {
    $context = $context_raw['context'];
    $form[$context] = array(
      '#type'         => 'fieldset',
      '#title'        => $context_raw['title'],
      '#description'  => $context_raw['description'] . '<br>' . t('Provided by <code>@module.module</code>.', array('@module' => $context_raw['provider'])),
      '#collapsible'  => TRUE,
      '#collapsed'    => TRUE,
    );
    $form[$context][$context . '_pars'] = array(
      '#type'           => 'checkbox',
      '#title'          => t('Make parseable.'),
      '#default_value'  => (bool) $context_raw['parseable'],
    );

    // Build the Transcoder editing form per-type
    $form[$context]['transcoders'] = array(
      '#type'         => 'fieldset',
      '#title'        => t('Transcoders for %context by Atom Type', array('%context' => $context)),
      '#collapsible'  => FALSE,
    );
    foreach ($scald_config->types as $type => $details) {
      // Build the array of Transcoder options
      $transcoders = array();
      $transcoders['@none'] = t('None');
      $transcoders['passthrough@passthrough'] = t('Passthrough');
      $transcoder_results = db_query("
        SELECT
          t.transcoder AS transcoder,
          t.title AS title,
          tf.file_format AS file_format
        FROM
          {scald_transcoders} t
        LEFT JOIN
          {scald_transcoder_formats} tf
            ON tf.transcoder = t.transcoder
        WHERE
          tf.file_format IN (SELECT file_format FROM {scald_context_type_formats} WHERE context='%s')
      ", $context);
      while ($transcoder_raw = db_fetch_array($transcoder_results)) {
        $transcoders[$transcoder_raw['transcoder'] . '@' . $transcoder_raw['file_format']] = $transcoder_raw['title'];
      }

      $form[$context]['transcoders'][$context . '@' . $type . '_type'] = array(
        '#type'           => 'select',
        '#title'          => $scald_config->types[$type]['title'],
        '#default_value'  => (
          (
            !empty($scald_config->contexts[$context]['type_format'])
            && !empty($scald_config->contexts[$context]['type_format'][$type])
          )
          ? $scald_config->contexts[$context]['type_format'][$type]['transcoder'] . '@' . $scald_config->contexts[$context]['type_format'][$type]['file_format'] 
          : '@none'
        ),
        '#options'        => $transcoders,
      );
    }
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
  foreach ($form_state['values'] as $key => $value) {
    switch (substr($key, -5)) {
      // Parseability
      case '_pars':
        db_query(
          "
            UPDATE
              {scald_contexts}
            SET
              parseable = %d
            WHERE
              context = '%s'
          ",
          $value,
          substr($key, 0, -5)
        );
        break; // end '_pars'

      // Transcoders
      case '_type':
        list($context, $type) = split('@', substr($key, 0, -5));
        list($transcoder, $file_format) = split('@', $value);
        if ($value == '@none') {
          db_query("DELETE FROM {scald_context_type_transcoder} WHERE context = '%s' AND type = '%s'", $context, $type);
        }
        else {
          db_query(
            "
              INSERT INTO
                {scald_context_type_transcoder}
              SET
                context     = '%s',
                type        = '%s',
                file_format = '%s',
                transcoder  = '%s'
              ON DUPLICATE KEY
                UPDATE
                  file_format  = '%s',
                  transcoder   = '%s'
            ",
            $context,
            $type,
            $file_format,
            $transcoder,
            $file_format,
            $transcoder
          );
        }
        break; // end '_type'
    }
  }

  $scald_config_old = variable_get('scald_config', 0);
  scald_config_rebuild('contexts');
  $scald_config = variable_get('scald_config', 0);

  $changed = array();
//  foreach ($scald_config->contexts as $context => $details) {
//    $changed = array_diff_assoc($scald_config_old->contexts[$context]['type_format']
  // @@@TODO: Use Batch API to alert all the Transcoders which *just* got assigned that there are new Atoms which they are responsible for Transcoding to a new format
} // end scald_admin_contexts_form_submit()



/**
 * The Scald Admin page for Scald Transcoders
 *
 * The Transcoders and their descriptions are simply listed; no configuration
 *  changes can be made from this page.
 */
function scald_admin_transcoders() {
  $content = '
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
  ';

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
 * The Scald Admin page for Scald Atom Relationships
 */
function scald_admin_relationships() {
  $content = '
    <h3>Scald Atom Relationships</h3>

    <p>Scald Atom Relationships define a way in which two Atoms can be related.  What is done with this information is dependant on the nature of the relationship.</p>
    <ol>
  ';

  $relationships_results = db_query("
    SELECT
      *
    FROM
      {scald_relationships}
  ");
  while ($relationship_raw = db_fetch_array($relationships_results)) {
    $content .= '
      <li>
        <strong>A ' . $relationship_raw['title'] . ' B / B ' . $relationship_raw['title_reverse'] . ' A</strong>
        <ul>
          <li><em>' . $relationship_raw['description'] . '</em></li>
          <li>Provided by <code>' . $relationship_raw['provider'] . '.module</code></li>
        </ul>
      </li>
    ';
  }
  $content .= '</ol>';

  return $content;
} // end scald_admin_relationships()



/**
 * The Scald Admin page for Scald Actions
 */
function scald_admin_actions() {
  $content_first = '
    <h3>Scald Actions</h3>

    <p>Scald Actions are akin to Drupal Permissions.  Each is something which can be done <em>to</em> or <em>with</em> an Atom.  They are assigned to Drupal user roles.  Only roles which have the "use scald" permission can have Actions assigned to them.</p>
  ';

  $content = '
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
  ';

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
