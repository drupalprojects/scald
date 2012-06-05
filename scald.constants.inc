<?php

/**
 * @file
 * Scald Constants
 *
 * Rarely-configured constants used for defining various elements of Scald.
 *
 * @ingroup scald
 */


define('SCALD_SLUG_MAX_LENGTH',           128);
define('SCALD_SLUG_MATCH_PATTERN',        '/^[\w-]+$/');

// There are dozens of issues with integer values and variables in PHP.  All
//  integer values are unsigned and so the highest bit which is truly safe to
//  use in the way that Scald does is the 31st bit.
// This is the max power which can live in the db
define('SCALD_ACTIONS_MAX_POWER',         30);

define('SCALD_SAS_MATCH_PATTERN',         '/\[\s*scald=(\d+)(?(?=:):([\w-]+))(?(?=\s+)\s+([^\]]*))\s*\]/');
define('SCALD_RENDERED_MATCH_PATTERN',    '/<!--\s*scald=(\d+)(?(?=:):([\w-]+))(?(?=\s+)\s+([^\]]*))\s*-->.*<!--\s*END scald=\1\s*-->/sU');

// How many users to load and save at a time in order to rebuild Actions
//  bitstrings
define('SCALD_ADMIN_ACTIONS_BATCH_LIMIT', 1);

// How many users to register as Authors at a time during hook_enable().
define('SCALD_ENABLE_BATCH_LIMIT',        100);
