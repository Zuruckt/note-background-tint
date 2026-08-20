/**
 * Pure helpers for resolving the stored Note background colour into a PIXI tint.
 * This file intentionally has no dependency on Foundry globals so that it can be unit tested.
 * @module
 */

/**
 * The module identifier, used as the flag scope.
 * @type {string}
 */
export const MODULE_ID = "note-background-tint";

/**
 * The flag key under which the background colour is persisted.
 * @type {string}
 */
export const FLAG_KEY = "background";

/**
 * The fully qualified form input path used by the Note configuration sheet.
 * @type {string}
 */
export const FLAG_PATH = `flags.${MODULE_ID}.${FLAG_KEY}`;

/**
 * The tint applied when no background colour is configured. This is the identity tint, which
 * reproduces the default appearance of ControlIcon#bg exactly.
 * @type {number}
 */
export const DEFAULT_TINT = 0xFFFFFF;

/**
 * Normalize a raw form or flag value into either a colour string or null.
 * Blank strings are treated as "not configured" so that clearing the input restores the default.
 * @param {*} value                 The raw stored or submitted value.
 * @returns {string|null}           A trimmed colour string, or null if no colour is configured.
 */
export function normalizeColor(value) {
  if ( typeof value !== "string" ) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Resolve a stored flag value into a tint which can be assigned to ControlIcon#bg.
 * Absent, blank, and invalid values all fall back to the default white background so that
 * existing Notes and malformed data continue to render exactly as they do in core.
 * @param {*} value                             The stored flag value.
 * @param {(color: *) => Color} from            A Color factory, i.e. foundry.utils.Color.from.
 * @returns {number}                            The tint to apply.
 */
export function resolveTint(value, from) {
  const color = normalizeColor(value);
  if ( color === null ) return DEFAULT_TINT;
  let parsed;
  try {
    parsed = from(color);
  } catch(err) {
    return DEFAULT_TINT;
  }
  if ( !parsed?.valid ) return DEFAULT_TINT;
  return Number(parsed);
}
