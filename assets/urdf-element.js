/* Standalone Turbopack entry for the URDF web component.
   It loads only the viewer modules from the exported bundle; the Next.js
   application runtime is intentionally not started on this static page. */
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === "object" ? document.currentScript : undefined,
  990001,
  (runtime) => {
    "use strict";

    Promise.all([
      runtime.l("static/chunks/1x06viit22mp_.js"),
      runtime.l("static/chunks/3lt-fm4xfctwb.js"),
    ]).then(() => {
      const manipulatorModule = runtime.i(73750);
      const loaderModule = runtime.i(658);
      const threeModule = runtime.i(90072);
      if (!customElements.get("urdf-manipulator")) {
        const Manipulator = manipulatorModule.default;
        const STLLoader = loaderModule.default;
        customElements.define("urdf-manipulator", class extends Manipulator {
          constructor() {
            super();
            const loader = new STLLoader();
            this.loadMeshFunc = loader.defaultMeshLoader.bind(loader);
          }
        });
      }

      window.__ruggedizedWristThree = threeModule;
      window.dispatchEvent(new Event("urdf-runtime-ready"));
    }).catch((error) => {
      console.error("Failed to initialize the URDF viewer", error);
      window.dispatchEvent(new CustomEvent("urdf-runtime-error", { detail: error }));
    });
  },
]);

(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === "object" ? document.currentScript : undefined,
  {
    otherChunks: [
      "static/chunks/240s5a6-rup44.js",
      "static/chunks/2dsm156jex-1e.js",
    ],
    runtimeModuleIds: [990001],
  },
]);
