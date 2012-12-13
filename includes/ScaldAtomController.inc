<?php
/**
 * @file
 *   This file contains the Scald Atom controller, which overrides DrupalDefaultEntityController for atoms.
 */

class ScaldAtomController extends DrupalDefaultEntityController {
  protected function attachLoad(&$atoms, $revision_id = FALSE) {
    foreach ($atoms as $atom) {
      $atom->data = unserialize($atom->data);
    }

    parent::attachLoad($atoms, $revision_id);
  }
}
