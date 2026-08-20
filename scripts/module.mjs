import {DEFAULT_TINT, FLAG_KEY, FLAG_PATH, MODULE_ID, resolveTint} from "./tint.mjs";

/**
 * A symbol under which the resolved tint is remembered on a ControlIcon instance.
 * ControlIcon refreshes are render-flag driven and therefore deferred, so the icon has to be able
 * to re-apply the tint itself after core has refreshed its own visualization.
 * @type {symbol}
 */
const BG_TINT = Symbol("note-background-tint");

/* -------------------------------------------- */
/*  Rendering                                   */
/* -------------------------------------------- */

/**
 * Get the Color class, preferring the namespaced export.
 * @returns {typeof Color}
 */
function getColorClass() {
  return foundry.utils?.Color ?? globalThis.Color;
}

/**
 * Apply the configured background tint to the control icon of a Note.
 * @param {Note} note       The Note placeable which was drawn or refreshed.
 */
function applyBackgroundTint(note) {
  const icon = note.controlIcon;
  if ( !icon?.bg ) return;
  const ColorClass = getColorClass();
  const stored = note.document.getFlag(MODULE_ID, FLAG_KEY);
  const tint = resolveTint(stored, color => ColorClass.from(color));
  icon[BG_TINT] = tint;
  icon.bg.tint = tint;
}

/**
 * Wrap ControlIcon#_refresh so that a remembered tint survives core refreshes, whose ordering
 * relative to the refreshNote hook is not guaranteed. Icons which were never tinted by this module
 * are left completely untouched.
 */
function patchControlIconRefresh() {
  const ControlIcon = foundry.canvas.containers.ControlIcon;
  const wrapped = ControlIcon.prototype._refresh;
  ControlIcon.prototype._refresh = function(...args) {
    const result = wrapped.apply(this, args);
    const tint = this[BG_TINT];
    if ( (tint !== undefined) && this.bg ) this.bg.tint = tint;
    return result;
  };
}

/* -------------------------------------------- */
/*  Note Configuration                          */
/* -------------------------------------------- */

/**
 * Build the form group for the background colour, reusing the same ColorField input used by the
 * core Icon Tint field.
 * @param {string} value            The currently configured value.
 * @returns {HTMLElement}           The rendered form group.
 */
function createBackgroundFormGroup(value) {
  const field = new foundry.data.fields.ColorField({
    label: "NOTEBACKGROUNDTINT.FIELDS.background.label",
    hint: "NOTEBACKGROUNDTINT.FIELDS.background.hint"
  });
  return field.toFormGroup({localize: true}, {name: FLAG_PATH, value});
}

/**
 * Inject the Background Tint field into the Note configuration sheet, immediately after Icon Tint.
 * @param {NoteConfig} app          The Note configuration application.
 * @param {HTMLElement} element     The rendered application element.
 */
function onRenderNoteConfig(app, element) {
  const html = (element instanceof HTMLElement) ? element : element?.[0];
  if ( !html || html.querySelector(`[name="${FLAG_PATH}"]`) ) return;
  const anchor = html.querySelector('[name="texture.tint"]')?.closest(".form-group");
  if ( !anchor ) return;
  const value = app.document?.getFlag?.(MODULE_ID, FLAG_KEY) ?? "";
  anchor.after(createBackgroundFormGroup(value));
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

Hooks.once("init", patchControlIconRefresh);
Hooks.on("drawNote", applyBackgroundTint);
Hooks.on("refreshNote", applyBackgroundTint);
Hooks.on("renderNoteConfig", onRenderNoteConfig);

/** @type {{MODULE_ID: string, FLAG_KEY: string, FLAG_PATH: string, DEFAULT_TINT: number}} */
export const api = {MODULE_ID, FLAG_KEY, FLAG_PATH, DEFAULT_TINT};
