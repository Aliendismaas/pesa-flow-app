import app from "../src/index";

export default app;
if (typeof module !== "undefined" && module.exports) {
  module.exports = app;
  (module.exports as any).default = app;
}
