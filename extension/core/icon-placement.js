// Shared by extension settings and the isolated webpage content script.
(function () {
  "use strict";

  const DEFAULT_ANGLE = 90; // 0 = above, 90 = right, 180 = below, 270 = left.
  const normalizeAngle = value => typeof value === "number" && Number.isFinite(value)
    ? ((Math.round(value) % 360) + 360) % 360 : DEFAULT_ANGLE;

  function angleFromPoint(x, y, centerX, centerY) {
    return normalizeAngle(Math.atan2(x - centerX, centerY - y) * 180 / Math.PI);
  }

  function position(rect, angle, viewportWidth, viewportHeight, size = 36, gap = 10) {
    const radians = normalizeAngle(angle) * Math.PI / 180;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radiusX = rect.width / 2 + gap + size / 2;
    const radiusY = rect.height / 2 + gap + size / 2;
    const left = centerX + Math.sin(radians) * radiusX - size / 2;
    const top = centerY - Math.cos(radians) * radiusY - size / 2;
    const clamp = (value, maximum) => Math.max(4, Math.min(Math.max(4, maximum - size - 4), value));
    return {
      left: Math.round(clamp(left, viewportWidth)),
      top: Math.round(clamp(top, viewportHeight)),
    };
  }

  globalThis.FastSearchIconPlacement = Object.freeze({
    DEFAULT_ANGLE, normalizeAngle, angleFromPoint, position,
  });
})();
