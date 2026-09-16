/* Standalone Turbopack entry for the URDF web component.
   It loads only the viewer modules from the exported bundle; the Next.js
   application runtime is intentionally not started on this static page. */
(function prepareEmbeddedUrdf() {
  const source = window.__ruggedizedWristUrdfSource;
  const meshSources = window.__ruggedizedWristMeshSources;
  if (source) {
    window.__ruggedizedWristUrdfUrl =
      `data:text/xml;charset=utf-8,${encodeURIComponent(source)}`;
  }
  if (meshSources && typeof DecompressionStream === "function") {
    window.__ruggedizedWristMeshDataReady = Promise.all(
      Object.entries(meshSources).map(async ([name, encoded]) => {
        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const stream = new Blob([bytes])
          .stream()
          .pipeThrough(new DecompressionStream("gzip"));
        return [name, await new Response(stream).arrayBuffer()];
      }),
    ).then((entries) => {
      window.__ruggedizedWristMeshData = Object.fromEntries(entries);
    });
  }
})();

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
            const meshSources = window.__ruggedizedWristMeshSources;
            const aliases = {
              "Base.stl": "wrist_base.stl",
              "mountToArm.stl": "mount_to_arm.stl",
              "_3D______5044_5600_6709_2023_10_245047.stl": "pitch_motor.stl",
              "PitchMotorPulleyConnector.stl": "pitch_pulley_connector.stl",
              "PitchMotorPulley.stl": "pitch_pulley.stl",
              "RollMotorBracket.stl": "roll_motor_bracket_anonymous.stl",
              "_______1.stl": "roll_motor_housing.stl",
              "______44380227.stl": "roll_output.stl",
              "gecko-original.stl": "gecko_attachment.stl",
            };

            if (!meshSources || typeof DecompressionStream !== "function") {
              this.loadMeshFunc = loader.defaultMeshLoader.bind(loader);
              return;
            }

            const meshUrls = new Map();

            this.loadMeshFunc = (url, manager, done) => {
              const decodedUrl = decodeURIComponent(url);
              const filename = decodedUrl.split("/").pop().split("?")[0];
              const representative = aliases[filename] || "empty.stl";
              if (!meshUrls.has(representative)) {
                const data = window.__ruggedizedWristMeshData[representative]
                  || window.__ruggedizedWristMeshData["empty.stl"];
                meshUrls.set(
                  representative,
                  `${URL.createObjectURL(new Blob([data], { type: "model/stl" }))}#mesh.stl`,
                );
              }
              loader.defaultMeshLoader(meshUrls.get(representative), manager, done);
            };
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
