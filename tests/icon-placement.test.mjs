import test from "node:test";
import assert from "node:assert/strict";
import "../extension/core/icon-placement.js";

const { normalizeAngle, angleFromPoint, position, DEFAULT_ANGLE } = globalThis.FastSearchIconPlacement;
const selection = { left: 80, top: 80, width: 40, height: 20 };

test("dial has a defined right-side default and normalizes all angles", () => {
  assert.equal(DEFAULT_ANGLE, 90);
  assert.equal(normalizeAngle(450), 90);
  assert.equal(normalizeAngle(-90), 270);
  assert.equal(normalizeAngle(NaN), 90);
  assert.equal(normalizeAngle(Infinity), 90);
});
test("pointer positions cover all four directions and diagonal positions", () => {
  assert.equal(angleFromPoint(100, 0, 100, 100), 0);
  assert.equal(angleFromPoint(200, 100, 100, 100), 90);
  assert.equal(angleFromPoint(100, 200, 100, 100), 180);
  assert.equal(angleFromPoint(0, 100, 100, 100), 270);
  assert.equal(angleFromPoint(200, 0, 100, 100), 45);
});
test("selection icon stays outside the text on every cardinal direction", () => {
  const top = position(selection, 0, 300, 300);
  const right = position(selection, 90, 300, 300);
  const bottom = position(selection, 180, 300, 300);
  const left = position(selection, 270, 300, 300);
  assert.equal(top.top + 36 + 10, selection.top);
  assert.equal(right.left, selection.left + selection.width + 10);
  assert.equal(bottom.top, selection.top + selection.height + 10);
  assert.equal(left.left + 36 + 10, selection.left);
});
test("icon placement is clamped to small viewports", () => {
  for (const angle of [0, 45, 90, 180, 270, 359]) {
    const point = position({ left: 0, top: 0, width: 5, height: 5 }, angle, 80, 75);
    assert.ok(point.left >= 4 && point.left <= 40);
    assert.ok(point.top >= 4 && point.top <= 35);
  }
});
