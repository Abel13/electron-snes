# Plugin API migration policy

## Purpose

This policy defines how PixelCore evolves public plugin contracts without forcing
unnecessary changes on community plugins. Plugin package versions follow semantic
versioning; the manifest `apiVersion` is a separate positive integer that represents a
host contract revision.

## Compatibility rules

API revision `1` remains current while changes are additive and preserve the behavior
of valid revision 1 plugins. Compatible changes include:

- adding optional manifest fields with safe defaults;
- adding optional capabilities that hosts feature-detect;
- adding new exported helpers without changing existing signatures;
- broadening validation only when every previously valid definition remains valid;
- fixing implementation defects without changing documented contract behavior.

A new API revision is required when a change can make a previously valid plugin fail,
change the meaning of existing data, remove or rename an export, tighten a required
constraint, or alter a security boundary in a way that requires plugin participation.
Internal refactoring does not justify a new revision.

## Change process

Every public contract change must:

1. classify the change as compatible or breaking before implementation;
2. document affected plugin types, capabilities, permissions, and security boundaries;
3. add contract fixtures and tests for both retained and new behavior;
4. update the SDK reference, authoring guide, changelog, and an ADR when the decision is
   architectural;
5. provide migration instructions before a breaking revision is enabled by default.

The compatibility classification is reviewed independently from the plugin package's
semantic version. A package major release may reorganize tooling without changing the
plugin API revision, while a host contract break requires a new API revision even if
the implementation package is unpublished.

## Support and deprecation

Hosts declare an explicit inclusive support range. When revision `2` is introduced,
the first compatible host should support `1..2` unless retaining revision 1 would
create a documented security or correctness risk.

Deprecation is advisory and must not make a compatible plugin inactive. Deprecated
contracts remain documented and tested while their API revision is supported. Removal
requires all of the following:

- a replacement contract and executable migration example;
- at least one stable host release that supports both revisions;
- a documented end-of-support release or date;
- diagnostics that identify the unsupported revision without loading plugin code;
- explicit justification when security requires an accelerated removal.

PixelCore does not silently reinterpret, rewrite, or negotiate a plugin's declared
revision. An unsupported plugin remains discoverable as inactive and receives the
`unsupported-plugin-api-version` diagnostic.

## Migration guide requirements

Each breaking revision must publish a guide containing:

- a summary of changed behavior and the reason for the break;
- before-and-after manifest and definition examples;
- an export and field mapping table;
- permission and security implications;
- instructions for running contract validation against both revisions;
- known limitations and rollback guidance.

Migration must be possible through public SDKs. A guide must never require imports from
PixelCore internals, Electron APIs, filesystem paths, or concrete official plugins.

## Contract verification

Official plugins, examples, and scaffold output must run against the same public
contract runner available to community authors. Compatibility tests retain fixtures
for every supported API revision and verify that:

- compatible plugins remain eligible;
- unsupported revisions remain inactive and never execute;
- invalid definitions return safe, actionable diagnostics;
- no SDK exposes host implementation details.

Temporary exceptions must identify an owner, rationale, affected revision, and removal
condition. They may not bypass manifest validation, permissions, or activation gates.
