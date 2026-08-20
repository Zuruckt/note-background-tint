import assert from "node:assert/strict";
import test from "node:test";

/**
 * A stand-in for foundry.utils.Color which only understands #rrggbb.
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

/**
 * A stand-in for ControlIcon whose own refresh resets the background, as a redraw would.
 */
class FakeControlIcon {
  bg = {tint: 0xFFFFFF};

  refreshCount = 0;

  _refresh() {
    this.refreshCount++;
    this.bg.tint = 0xFFFFFF;
  }
}

const hooks = {once: new Map(), on: new Map()};

globalThis.Hooks = {
  once: (name, fn) => hooks.once.set(name, fn),
  on: (name, fn) => hooks.on.set(name, fn)
};

globalThis.foundry = {
  utils: {Color: FakeColor},
  canvas: {containers: {ControlIcon: FakeControlIcon}},
  data: {fields: {}}
};

const {api} = await import("../scripts/module.mjs");

/**
 * Build a Note-like placeable carrying the given flag value.
 * @param {*} background        The stored flag value, or undefined for an unconfigured Note.
 * @returns {object}            A minimal Note stand-in.
 */
function mockNote(background) {
  return {
    controlIcon: new FakeControlIcon(),
    document: {
      getFlag: (scope, key) => {
        assert.equal(scope, api.MODULE_ID);
        assert.equal(key, api.FLAG_KEY);
        return background;
      }
    }
  };
}

test("the module registers the expected hooks", () => {
  assert.ok(hooks.once.has("init"));
  assert.ok(hooks.on.has("drawNote"));
  assert.ok(hooks.on.has("refreshNote"));
  assert.ok(hooks.on.has("renderNoteConfig"));
});

test("an unconfigured Note keeps the default white background", () => {
  const note = mockNote(undefined);
  hooks.on.get("drawNote")(note);
  assert.equal(note.controlIcon.bg.tint, api.DEFAULT_TINT);
});

test("a configured Note tints its control icon background", () => {
  const note = mockNote("#3a1515");
  hooks.on.get("refreshNote")(note);
  assert.equal(note.controlIcon.bg.tint, 0x3a1515);
});

test("an invalid stored colour renders as the default background", () => {
  const note = mockNote("rgb(nope)");
  hooks.on.get("drawNote")(note);
  assert.equal(note.controlIcon.bg.tint, api.DEFAULT_TINT);
});

test("a Note without a drawn control icon is skipped", () => {
  const note = mockNote("#3a1515");
  note.controlIcon = null;
  assert.doesNotThrow(() => hooks.on.get("drawNote")(note));
});

test("the tint survives a deferred ControlIcon refresh", () => {
  hooks.once.get("init")();
  const note = mockNote("#9c15e5");
  hooks.on.get("drawNote")(note);
  note.controlIcon._refresh();
  assert.equal(note.controlIcon.refreshCount, 1);
  assert.equal(note.controlIcon.bg.tint, 0x9c15e5);
});

test("control icons this module never touched are left alone", () => {
  const icon = new FakeControlIcon();
  icon.bg.tint = 0x123456;
  icon._refresh();
  assert.equal(icon.refreshCount, 1);
  assert.equal(icon.bg.tint, 0xFFFFFF, "core behaviour is preserved for untinted icons");
});
