# Changelog

## [1.2.2] - 2026-11-27

Fixed an export that stopped part way through when a node was missing an optional property, which left most subflows with no files in src and reported only to the runtime log (issue #2).

Fixed file naming for node onStart and onStop functions.

Added support for Node-RED Dashboard v2 ui-template nodes.

Added a separate subflow folder option.

New files are written group-writable (666) and folders (777) so they stay editable when Node-RED runs as another user.

## [1.2.1] - 2024-10-15

Support for wp function nodes.

## [1.1.0] - 2022-11-29

Automatic flows reload added to Src-to-Flow

## [1.0.5] - 2022-11-27

_Initial release._
