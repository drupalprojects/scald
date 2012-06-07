<?php
/**
 * @file
 *   Provides default views for the Scald DnD Library module.
 */

/**
 * Implements hook_views_default_views.
 */
function scald_dnd_library_views_default_views() {
  $views = array();

  // Library view
  $view = new view;
  $view->name = 'scald_library';
  $view->description = 'Library provided by Scald to DnD, based on atoms.';
  $view->tag = '';
  $view->view_php = '';
  $view->base_table = 'scald_atoms';
  $view->is_cacheable = FALSE;
  $view->api_version = 2;
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */
  $handler = $view->new_display('default', 'Paramètres par défaut', 'default');
  $handler->override_option('relationships', array(
    'publisher' => array(
      'label' => 'Publisher',
      'required' => 0,
      'id' => 'publisher',
      'table' => 'scald_atoms',
      'field' => 'publisher',
      'relationship' => 'none',
      'override' => array(
        'button' => 'Remplacer',
      ),
    ),
  ));
  $handler->override_option('fields', array(
    'sid' => array(
      'id' => 'sid',
      'table' => 'scald_atoms',
      'field' => 'sid',
    ),
    'type' => array(
      'id' => 'type',
      'table' => 'scald_atoms',
      'field' => 'type',
    ),
    'provider' => array(
      'id' => 'provider',
      'table' => 'scald_atoms',
      'field' => 'provider',
    ),
    'base_id' => array(
      'id' => 'base_id',
      'table' => 'scald_atoms',
      'field' => 'base_id',
    ),
    'title' => array(
      'id' => 'title',
      'table' => 'scald_atoms',
      'field' => 'title',
    ),
    'name' => array(
      'label' => 'Publisher',
      'alter' => array(
        'alter_text' => 0,
        'text' => '',
        'make_link' => 0,
        'path' => '',
        'link_class' => '',
        'alt' => '',
        'prefix' => '',
        'suffix' => '',
        'target' => '',
        'help' => '',
        'trim' => 0,
        'max_length' => '',
        'word_boundary' => 1,
        'ellipsis' => 1,
        'strip_tags' => 0,
        'html' => 0,
      ),
      'empty' => '',
      'hide_empty' => 0,
      'empty_zero' => 0,
      'link_to_user' => 1,
      'overwrite_anonymous' => 0,
      'anonymous_text' => '',
      'exclude' => 0,
      'id' => 'name',
      'table' => 'users',
      'field' => 'name',
      'relationship' => 'publisher',
      'override' => array(
        'button' => 'Remplacer',
      ),
    ),
    'representation' => array(
      'label' => 'Representation',
      'alter' => array(
        'alter_text' => 0,
        'text' => '',
        'make_link' => 0,
        'path' => '',
        'link_class' => '',
        'alt' => '',
        'prefix' => '',
        'suffix' => '',
        'target' => '',
        'help' => '',
        'trim' => 0,
        'max_length' => '',
        'word_boundary' => 1,
        'ellipsis' => 1,
        'strip_tags' => 0,
        'html' => 0,
      ),
      'empty' => '',
      'hide_empty' => 0,
      'empty_zero' => 0,
      'context' => 'sdl_library_item',
      'exclude' => 0,
      'id' => 'representation',
      'table' => 'scald_atoms',
      'field' => 'representation',
      'relationship' => 'none',
    ),
  ));
  $handler->override_option('filters', array(
    'title' => array(
      'operator' => 'contains',
      'value' => '',
      'group' => '0',
      'exposed' => TRUE,
      'expose' => array(
        'use_operator' => 0,
        'operator' => 'title_op',
        'identifier' => 'title',
        'label' => 'Titre',
        'optional' => 1,
        'remember' => 0,
      ),
      'case' => 0,
      'id' => 'title',
      'table' => 'scald_atoms',
      'field' => 'title',
      'relationship' => 'none',
    ),
    'uid' => array(
      'operator' => 'in',
      'value' => '',
      'group' => '0',
      'exposed' => TRUE,
      'expose' => array(
        'use_operator' => 0,
        'operator' => 'uid_op',
        'identifier' => 'uid',
        'label' => 'Publisher',
        'optional' => 1,
        'remember' => 0,
        'reduce' => 0,
      ),
      'id' => 'uid',
      'table' => 'users',
      'field' => 'uid',
      'relationship' => 'publisher',
      'override' => array(
        'button' => 'Remplacer',
      ),
    ),
    'type' => array(
      'operator' => 'in',
      'value' => array(),
      'group' => '0',
      'exposed' => TRUE,
      'expose' => array(
        'use_operator' => 0,
        'operator' => 'type_op',
        'identifier' => 'type',
        'label' => 'Type',
        'optional' => 1,
        'single' => 0,
        'remember' => 0,
        'reduce' => 0,
      ),
      'id' => 'type',
      'table' => 'scald_atoms',
      'field' => 'type',
      'relationship' => 'none',
      'override' => array(
        'button' => 'Remplacer',
      ),
    ),
    'actions' => array(
      'operator' => '&',
      'value' => 5,
      'group' => '0',
      'exposed' => FALSE,
      'expose' => array(
        'operator' => FALSE,
        'label' => '',
      ),
      'id' => 'actions',
      'table' => 'scald_atoms',
      'field' => 'actions',
      'override' => array(
        'button' => 'Remplacer',
      ),
      'relationship' => 'none',
    ),
  ));
  $handler->override_option('access', array(
    'type' => 'perm',
    'perm' => 'administer scald',
  ));
  $handler->override_option('cache', array(
    'type' => 'none',
  ));
  $handler->override_option('title', 'Bibliothèque de contenu');
  $handler->override_option('empty', '<div class=\'editor-item\'>No atom found.</div>');
  $handler->override_option('empty_format', '2');
  $handler->override_option('use_ajax', TRUE);
  $handler->override_option('items_per_page', 8);
  $handler->override_option('use_pager', '1');
  $handler->override_option('style_plugin', 'table');
  $handler = $view->new_display('page', 'Page', 'page_1');
  $handler->override_option('path', 'admin/content/scald/atoms');
  $handler->override_option('menu', array(
    'type' => 'tab',
    'title' => 'Atoms',
    'description' => '',
    'weight' => '-60',
    'name' => 'navigation',
  ));
  $handler->override_option('tab_options', array(
    'type' => 'none',
    'title' => '',
    'description' => '',
    'weight' => 0,
    'name' => 'navigation',
  ));
  $handler = $view->new_display('dnd_library', 'Scald Library', 'dnd_library_2');
  $handler->override_option('fields', array(
    'representation' => array(
      'label' => '',
      'alter' => array(
        'alter_text' => 0,
        'text' => '',
        'make_link' => 0,
        'path' => '',
        'link_class' => '',
        'alt' => '',
        'prefix' => '',
        'suffix' => '',
        'target' => '',
        'help' => '',
        'trim' => 0,
        'max_length' => '',
        'word_boundary' => 1,
        'ellipsis' => 1,
        'strip_tags' => 0,
        'html' => 0,
      ),
      'empty' => '',
      'hide_empty' => 0,
      'empty_zero' => 0,
      'context' => 'sdl_library_item',
      'exclude' => 0,
      'id' => 'representation',
      'table' => 'scald_atoms',
      'field' => 'representation',
      'relationship' => 'none',
      'override' => array(
        'button' => 'Utiliser la valeur par défaut',
      ),
    ),
    'title' => array(
      'label' => 'Titre',
      'alter' => array(
        'alter_text' => 0,
        'text' => '',
        'make_link' => 0,
        'path' => '',
        'link_class' => '',
        'alt' => '',
        'prefix' => '',
        'suffix' => '',
        'target' => '',
        'help' => '',
        'trim' => 0,
        'max_length' => '',
        'word_boundary' => 1,
        'ellipsis' => 1,
        'strip_tags' => 0,
        'html' => 0,
      ),
      'empty' => '',
      'hide_empty' => 0,
      'empty_zero' => 0,
      'exclude' => 0,
      'id' => 'title',
      'table' => 'scald_atoms',
      'field' => 'title',
      'override' => array(
        'button' => 'Utiliser la valeur par défaut',
      ),
      'relationship' => 'none',
    ),
    'sid' => array(
      'label' => 'Scald ID',
      'alter' => array(
        'alter_text' => 0,
        'text' => '',
        'make_link' => 0,
        'path' => '',
        'link_class' => '',
        'alt' => '',
        'prefix' => '',
        'suffix' => '',
        'target' => '',
        'help' => '',
        'trim' => 0,
        'max_length' => '',
        'word_boundary' => 1,
        'ellipsis' => 1,
        'strip_tags' => 0,
        'html' => 0,
      ),
      'empty' => '',
      'hide_empty' => 0,
      'empty_zero' => 0,
      'set_precision' => FALSE,
      'precision' => 0,
      'decimal' => '.',
      'separator' => ',',
      'prefix' => '',
      'suffix' => '',
      'exclude' => 0,
      'id' => 'sid',
      'table' => 'scald_atoms',
      'field' => 'sid',
      'override' => array(
        'button' => 'Utiliser la valeur par défaut',
      ),
      'relationship' => 'none',
    ),
  ));
  $handler->override_option('access', array(
    'type' => 'perm',
    'perm' => 'use scald',
  ));
  $handler->override_option('style_plugin', 'scald_library');
  $handler->override_option('path', 'scald/library_dnd');
  $handler->override_option('menu', array(
    'type' => 'none',
    'title' => '',
    'description' => '',
    'weight' => 0,
    'name' => 'navigation',
  ));
  $handler->override_option('tab_options', array(
    'type' => 'none',
    'title' => '',
    'description' => '',
    'weight' => 0,
    'name' => 'navigation',
  ));
  $views[$view->name] = $view;

  return $views;
}
