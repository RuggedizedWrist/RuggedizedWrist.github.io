const page = document.body;
const outline = document.querySelector("#outline");
const outlineButton = document.querySelector("[data-outline]");
const themeButton = document.querySelector("[data-theme-toggle]");
const storedTheme = localStorage.getItem("distalshift-theme");

if (storedTheme === "day" || storedTheme === "night") {
  page.dataset.theme = storedTheme;
}

themeButton.addEventListener("click", () => {
  const next = page.dataset.theme === "day" ? "night" : "day";
  page.dataset.theme = next;
  localStorage.setItem("distalshift-theme", next);
});

outlineButton.addEventListener("click", () => {
  const open = outline.hasAttribute("hidden");
  outline.toggleAttribute("hidden", !open);
  outlineButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#outline a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth < 1100) {
      outline.setAttribute("hidden", "");
      outlineButton.setAttribute("aria-expanded", "false");
    }
  });
});

const sections = [...document.querySelectorAll("main section, .hero")];
const outlineLinks = [...document.querySelectorAll("#outline a")];
const observer = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  outlineLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4] });
sections.forEach((section) => observer.observe(section));

const modal = document.querySelector("#player");
const modalVideo = modal.querySelector("video");

document.querySelectorAll("[data-expand]").forEach((button) => {
  button.addEventListener("click", () => {
    const source = button.parentElement.querySelector("video");
    modalVideo.src = source.currentSrc || source.querySelector("source").src;
    modalVideo.currentTime = source.currentTime || 0;
    modal.removeAttribute("hidden");
    modalVideo.play();
    source.pause();
  });
});

function closeModal() {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
  modal.setAttribute("hidden", "");
}

modal.querySelector("[data-close]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
});

document.querySelector("[data-copy]").addEventListener("click", async (event) => {
  const text = document.querySelector("#bibtex").textContent.trim();
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = "Copy BibTeX"; }, 1400);
});

const enableUrdf = () => {
  const viewer = document.querySelector("urdf-manipulator[data-urdf]");
  if (!viewer || viewer.dataset.loadUiReady === "true") return;
  viewer.dataset.loadUiReady = "true";

  const canvas = viewer.closest(".urdf-canvas");
  const status = canvas?.querySelector(".viewer-status");
  const controls = viewer.closest(".urdf-viewer")?.querySelectorAll("input, .reset-joints") || [];
  const jointSpecs = [
    { name: "wrist_pitch_joint", input: controls[0] },
    { name: "wrist_roll_joint", input: controls[1] },
  ];
  const reset = controls[2];

  const syncJointControls = () => {
    const values = viewer.jointValues || {};
    jointSpecs.forEach(({ name, input }) => {
      if (!input || !Number.isFinite(values[name])) return;
      const degrees = Math.round(values[name] * 180 / Math.PI);
      input.value = String(degrees);
      const output = input.closest("label")?.querySelector("output");
      if (output) output.textContent = `${degrees}°`;
    });
  };

  jointSpecs.forEach(({ name, input }) => {
    input?.addEventListener("input", () => {
      const degrees = Number(input.value);
      viewer.setJointValue(name, degrees * Math.PI / 180);
      const output = input.closest("label")?.querySelector("output");
      if (output) output.textContent = `${degrees}°`;
    });
  });
  reset?.addEventListener("click", () => {
    jointSpecs.forEach(({ name }) => viewer.setJointValue(name, 0));
    syncJointControls();
  });
  viewer.addEventListener("angle-change", syncJointControls);
  viewer.addEventListener("manipulate-start", (event) => {
    jointSpecs.forEach(({ name, input }) => input?.closest("label")?.classList.toggle("active", name === event.detail));
  });
  viewer.addEventListener("manipulate-end", () => {
    jointSpecs.forEach(({ input }) => input?.closest("label")?.classList.remove("active"));
    syncJointControls();
  });

  controls.forEach((control) => { control.disabled = true; });

  viewer.addEventListener("geometry-loaded", () => {
    controls.forEach((control) => { control.disabled = false; });
    syncJointControls();

    const three = window.__ruggedizedWristThree;
    if (three && viewer.robot) {
      viewer.renderer.shadowMap.enabled = false;
      viewer.plane.visible = false;
      viewer.ambientLight.intensity = 0.68;
      viewer.directionalLight.intensity = 1.15;
      viewer.robot.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const source = Array.isArray(object.material) ? object.material[0] : object.material;
        const material = new three.MeshPhongMaterial({
          color: source.color,
          shininess: 4,
          specular: 0x202b34,
        });
        material.name = source.name;
        object.material = material;
        object.castShadow = false;
        object.receiveShadow = false;
      });

      viewer.world.updateMatrixWorld(true);
      const bounds = new three.Box3().setFromObject(viewer.robot);
      const center = bounds.getCenter(new three.Vector3());
      const size = bounds.getSize(new three.Vector3());
      const span = Math.max(size.x, size.y, size.z);
      const direction = new three.Vector3(1.35, 1.65, 1.05).normalize();
      viewer.controls.target.copy(center);
      viewer.camera.position.copy(center).addScaledVector(direction, 1.72 * span);
      viewer.camera.fov = 42;
      viewer.camera.near = Math.max(span / 100, 1e-4);
      viewer.camera.far = Math.max(100 * span, 10);
      viewer.camera.updateProjectionMatrix();
      viewer.controls.minDistance = 0.35 * span;
      viewer.controls.maxDistance = 12 * span;
      viewer.controls.update();
      viewer.redraw();
    }

    if (status) {
      status.classList.add("ready");
      status.innerHTML = "<span></span>Original URDF loaded · 2 movable joints";
    }
  }, { once: true });

  const loadOriginalUrdf = () => {
    const embeddedUrdf = window.__ruggedizedWristUrdfUrl;
    const meshDataReady = window.__ruggedizedWristMeshDataReady || Promise.resolve();
    meshDataReady
      .then(() => viewer.setAttribute("urdf", embeddedUrdf || new URL(viewer.dataset.urdf, location.origin).href))
      .catch((error) => {
        console.error("Failed to prepare embedded URDF assets", error);
        window.dispatchEvent(new CustomEvent("urdf-runtime-error", { detail: error }));
      });
  };

  if (customElements.get("urdf-manipulator")) loadOriginalUrdf();
  else customElements.whenDefined("urdf-manipulator").then(loadOriginalUrdf);

  window.addEventListener("urdf-runtime-error", () => {
    controls.forEach((control) => { control.disabled = true; });
    if (status) {
      status.classList.add("error");
      status.innerHTML = "<span></span>Interactive model could not be initialized";
    }
  }, { once: true });
};

enableUrdf();
