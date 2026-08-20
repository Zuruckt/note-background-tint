# Map Note Background Tint

A Foundry VTT v14 module which adds a persisted, per-Note background colour to the standard Map
Note configuration sheet.

Foundry lets you tint the note *icon* through `texture.tint`, but the `ControlIcon` background
(`note.controlIcon.bg`) has no document property and no configuration UI. This module adds one.

## Data shape

The colour is stored as a document flag, which is the only per-document extension point available
to a module — the Note schema (`foundry.documents.BaseNote`) is defined and validated server side,
so a module cannot add a `texture.background` field to it:

```js
note.flags["note-background-tint"].background  // e.g. "#3a1515"
```

The flag is optional. When it is absent, blank, or unparseable, the control icon background is set
to the identity tint `0xFFFFFF`, which is exactly how core renders it today. No migration is
needed, and existing worlds are unaffected.

## Behaviour

- **UI** — a `Background Tint` form group is injected into `NoteConfig` immediately after
  `Icon Tint`. It is built from a `foundry.data.fields.ColorField`, so it renders the same
  `<color-picker>` element as the core Icon Tint field and is submitted by the normal
  `DocumentSheetV2` form pipeline.
- **Rendering** — the tint is applied on the `drawNote` and `refreshNote` hooks. `ControlIcon` is
  render-flag driven in v14, so its refresh is deferred; `ControlIcon#_refresh` is wrapped to
  re-apply a remembered tint. Icons this module never tinted are left untouched.

## Development

```bash
npm test           # node:test unit tests, no dependencies
```

The tests stub `Hooks`, `foundry.utils.Color`, and `ControlIcon`; they cover the colour resolution
and the rendering hooks. The `NoteConfig` DOM injection has no automated coverage — verify it
manually:

1. Enable the module in a v14 world and open a Map Note's configuration sheet.
2. Confirm `Background Tint` appears directly below `Icon Tint`, and is empty for existing notes.
3. Pick a colour, save, and confirm the note's icon background is tinted on the canvas.
4. Reload the world and confirm the colour persisted.
5. Clear the field, save, and confirm the background returns to the default white.
