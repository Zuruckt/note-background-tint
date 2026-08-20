import assert from "node:assert/strict";
import test from "node:test";
import {DEFAULT_TINT, FLAG_PATH, MODULE_ID, normalizeColor, resolveTint} from "../scripts/tint.mjs";

/**
 * A stand-in for foundry.utils.Color which only understands #rrggbb, mirroring Color.from's
 * contract of returning a Number subclass with a "valid" accessor.
 */
class FakeColor extends Number {
  constructor(value, valid) {
    super(value);
    this.valid = valid;
  }

  static from(color) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(color));
    return match ? new FakeColor(parseInt(match[1], 16), true) : new FakeColor(NaN, false);
  }
}

const from = color => FakeColor.from(color);

test("normalizeColor treats absent and blank values as unconfigured", () => {
  assert.equal(normalizeColor(undefined), null);
  assert.equal(normalizeColor(null), null);
  assert.equal(normalizeColor(""), null);
  assert.equal(normalizeColor("   "), null);
  assert.equal(normalizeColor(0x3a1515), null);
});

test("normalizeColor trims configured values", () => {
  assert.equal(normalizeColor("#3a1515"), "#3a1515");
  assert.equal(normalizeColor("  #3a1515 "), "#3a1515");
});

test("resolveTint falls back to the default white background", () => {
  assert.equal(resolveTint(undefined, from), DEFAULT_TINT);
  assert.equal(resolveTint(null, from), DEFAULT_TINT);
  assert.equal(resolveTint("", from), DEFAULT_TINT);
  assert.equal(DEFAULT_TINT, 0xFFFFFF);
});

test("resolveTint parses a configured colour", () => {
  assert.equal(resolveTint("#3a1515", from), 0x3a1515);
  assert.equal(resolveTint("#9c15e5", from), 0x9c15e5);
});

test("resolveTint falls back for invalid colours instead of throwing", () => {
  assert.equal(resolveTint("not-a-colour", from), DEFAULT_TINT);
  assert.equal(resolveTint("#zzz", from), DEFAULT_TINT);
  assert.equal(resolveTint("#3a1515", () => { throw new Error("boom"); }), DEFAULT_TINT);
});

test("the flag path is scoped to the module identifier", () => {
  assert.equal(MODULE_ID, "note-background-tint");
  assert.equal(FLAG_PATH, "flags.note-background-tint.background");
});
