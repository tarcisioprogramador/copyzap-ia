import "@testing-library/jest-dom";

// Polyfill hasPointerCapture for jsdom (needed by Radix UI on older jsdom)
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
