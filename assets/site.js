(() => {
  if (window.__ruggedizedWristSiteInitialized) return;
  window.__ruggedizedWristSiteInitialized = true;
  const demoSources = {
    cardiac: ["/media/heart-7dof.webm", "/media/heart-9dof.webm"],
    longitudinal: ["/media/near-far-7dof.webm", "/media/near-far-9dof.webm"],
    waist: ["/media/cross-waist-7dof.webm", "/media/cross-waist-9dof.webm"],
  };

  const synchronize = (group) => {
    const videos = Array.from(group.querySelectorAll("video"));
    if (videos.length !== 2) return;
    let updating = false;
    const setTime = (time) => {
      updating = true;
      videos.forEach((video) => {
        if (Number.isFinite(video.duration)) {
          video.currentTime = Math.min(time, Math.max(0, video.duration - 0.02));
        }
      });
      updating = false;
    };
    videos.forEach((video) => {
      video.addEventListener("play", () => {
        if (updating) return;
        videos.forEach((peer) => {
          if (peer !== video && peer.paused) peer.play().catch(() => {});
        });
      });
      video.addEventListener("pause", () => {
        if (updating) return;
        videos.forEach((peer) => {
          if (peer !== video && !peer.paused) peer.pause();
        });
      });
      video.addEventListener("seeking", () => {
        if (!updating) setTime(video.currentTime);
      });
    });
    window.setInterval(() => {
      if (videos.some((video) => video.paused || video.seeking)) return;
      const drift = videos[1].currentTime - videos[0].currentTime;
      if (Math.abs(drift) > 0.08) videos[1].currentTime = videos[0].currentTime;
    }, 250);
  };

  const hydrateDemoVideos = () => {
    document.querySelectorAll("[data-sync-group]").forEach((group) => {
      const sources = demoSources[group.dataset.syncGroup];
      if (!sources || group.dataset.videoReady === "true") return;

      const images = Array.from(group.querySelectorAll("figure > img"));
      if (images.length !== 2) return;

      images.forEach((image, index) => {
        const video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.poster = image.currentSrc || image.src;
        video.setAttribute("aria-label", image.alt);

        const source = document.createElement("source");
        source.src = sources[index];
        source.type = "video/webm";
        video.appendChild(source);
        image.replaceWith(video);
      });

      group.dataset.videoReady = "true";
      synchronize(group);
    });
  };

  const enableDeferredUrdf = () => {
    const viewer = document.querySelector("urdf-manipulator[data-urdf]");
    if (!viewer || viewer.dataset.loadUiReady === "true") return;
    viewer.dataset.loadUiReady = "true";

    const canvas = viewer.closest(".urdf-canvas");
    const status = canvas?.querySelector(".viewer-status");
    const controls = viewer.closest(".urdf-viewer")?.querySelectorAll("input, .reset-joints") || [];
    controls.forEach((control) => { control.disabled = true; });

    const prompt = document.createElement("div");
    prompt.className = "urdf-load-prompt";
    prompt.innerHTML = `
      <img src="/media/results/assembly.png" alt="RuggedizedWrist assembly overview">
      <div><strong>Explore the full wrist assembly</strong><span>The original high-resolution URDF loads only when requested, keeping the project page responsive.</span></div>
      <button type="button">Load interactive URDF</button>`;
    canvas?.appendChild(prompt);

    if (status) status.innerHTML = "<span></span>Interactive model ready on request";

    prompt.querySelector("button")?.addEventListener("click", () => {
      prompt.classList.add("loading");
      const button = prompt.querySelector("button");
      if (button) {
        button.disabled = true;
        button.textContent = "Loading model…";
      }
      if (status) status.innerHTML = "<span></span>Loading high-resolution URDF geometry…";
      viewer.setAttribute("urdf", viewer.dataset.urdf);
    });

    viewer.addEventListener("geometry-loaded", () => {
      prompt.remove();
      controls.forEach((control) => { control.disabled = false; });
    }, { once: true });
  };

  const contactSuite = `
    <section class="contact-suite" id="contact-suite">
      <div class="container">
        <p class="section-kicker">Contact-rich suite</p>
        <h2>Force tracking and task-scale motion</h2>
        <p class="contact-intro">These panels unpack the rendered contact recordings after the free-space mechanism study. The force plots show both the nominal target and the measured signal so that contact transients, filtering, and sustained tracking can be read separately.</p>
        <div class="contact-grid">
          <figure class="contact-card"><img src="/media/results/human-travel.png" alt="Near and far human travel comparison" loading="lazy" decoding="async"><figcaption><strong>Near-to-far proximal travel</strong><span>The longitudinal scan reduces J1–J7 cumulative travel from 10.355 rad to 3.228 rad, a 68.8% reduction during the reported reorientation window.</span></figcaption></figure>
          <figure class="contact-card"><img src="/media/results/hydro15-force.png" alt="15 N hydroelastic force trace" loading="lazy" decoding="async"><figcaption><strong>15 N force tracking</strong><span>The feedback signal stays close to the 15 N nominal target; the raw physics-step trace preserves short contact transients that the controller filter suppresses.</span></figcaption></figure>
          <figure class="contact-card"><img src="/media/results/hydro35-force.png" alt="35 N hydroelastic force trace" loading="lazy" decoding="async"><figcaption><strong>35 N loading case</strong><span>This higher-load trace is included to show how the same contact-control structure behaves as the nominal normal force increases.</span></figcaption></figure>
          <figure class="contact-card"><img src="/media/results/hydro50-force.png" alt="50 N hydroelastic force trace" loading="lazy" decoding="async"><figcaption><strong>50 N stress case</strong><span>The complete cycle is retained as a stress case. It is descriptive evidence; it does not imply that every force or orientation gate passed.</span></figcaption></figure>
        </div>
      </div>
    </section>
    <section class="limitations" id="limitations">
      <div class="container limitations-grid"><div><p class="section-kicker">Scope and limitations</p><h2>Read the evidence at the right level</h2></div><p>The controlled free-space S2/S3 trials support the proximal dynamic and motion comparisons. Contact-rich panels are exploratory protocol traces: the evidence bundle records unmet hydro/orientation gates for some conditions and an aborted cardiac run. They are shown so the evaluation is inspectable, while contact-success claims remain bounded.</p></div>
    </section>`;

  const evidenceLibrary = `
    <section class="section evidence" id="evidence">
      <div class="container">
        <div class="section-heading"><p class="section-kicker">Detailed results</p><h2>Coverage, dynamics, mounting, and contact evidence</h2><p>Every figure is shown at its native aspect ratio with a short reading guide. The captions follow the experiment notes in <code>exp</code>: they distinguish kinematic coverage, proximal dynamic terms, gravity-inclusive motor torque, and exploratory contact traces.</p></div>
        <div class="evidence-grid">
          <figure class="evidence-card evidence-wide"><img src="/media/results/care-methods.png" alt="CARE benchmark summary across four inverse-kinematics methods" loading="lazy" decoding="async"><figcaption><strong>CARE benchmark: what is being measured</strong><span>Each bar aggregates the same 525 torso points. CARE coverage counts targets that satisfy pose feasibility, a J1–J7 RMS motion budget, and nonnegative geometric clearance; the benchmark therefore measures usable contact-anchored reorientation rather than unconstrained pose reachability.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/care-heatmap.png" alt="Contact-Anchored Reorientation Envelope heatmap" loading="lazy" decoding="async"><figcaption><strong>CARE envelope in pitch–axial-angle space</strong><span>The four panels show how the feasible orientation region expands when the two distal axes are available and weighted toward the wrist. Bright cells indicate more torso points passing the CARE gate; the proposed arrival plus distal IK keeps the broadest region across the sampled grid.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/care-coverage.png" alt="CARE coverage as a function of proximal motion budget" loading="lazy" decoding="async"><figcaption><strong>Coverage versus proximal motion budget</strong><span>At an 8° J1–J7 RMS budget, the four methods reach 5.155%, 34.447%, 87.209%, and 94.964% coverage. The curve is cumulative over 75,075 targets and includes infeasible samples, so it should be read as a budgeted task envelope rather than a global workspace guarantee.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/mount-comparison.png" alt="Baseline vertical and revised horizontal wrist mount comparison" loading="lazy" decoding="async"><figcaption><strong>Mount orientation comparison</strong><span>The vertical and horizontal assemblies are evaluated as complete configurations with different Home seeds. The plot compares coverage, pose feasibility, proximal RMS motion, clearance, and joint-limit failures; it is a configuration-level comparison, not an isolated mount-only ablation.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/s2-locked.png" alt="Locked-wrist S2 dynamic torque decomposition" loading="lazy" decoding="async"><figcaption><strong>S2 locked baseline</strong><span>With J8/J9 locked, the 7-DoF arm produces the axial 0°→90°→0° motion. The large black dynamic-sum traces show where the proximal arm supplies the reorientation acceleration.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/s2-active.png" alt="Active-wrist S2 dynamic torque decomposition" loading="lazy" decoding="async"><figcaption><strong>S2 active wrist</strong><span>The same matched-start trajectory is executed with the two distal joints active. Proximal inertia and velocity terms collapse toward zero; the small residual wrist-coupling curves are retained so the mechanism is visible rather than hidden.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/s2-total-motor.png" alt="Gravity-inclusive total motor torque comparison" loading="lazy" decoding="async"><figcaption><strong>Total motor torque, including gravity</strong><span>This panel must be read separately from the dynamic decomposition: active distal allocation reduces the proximal dynamic term, but configuration-dependent gravity makes the gravity-inclusive total motor RMS increase by about 11.3–11.7% in these trials.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/s3-speed.png" alt="S3 speed scaling comparison" loading="lazy" decoding="async"><figcaption><strong>Speed scaling across 8, 4, and 2 s one-way segments</strong><span>The locked dynamic RMS grows with 1/T² while the active-wrist dynamic curve stays near zero. Across all three speeds, proximal travel is reduced by about 99.25% and peak whole-robot kinetic energy by about 31.9%; the total motor torque panel remains nearly flat for the active case and should not be replaced by the dynamic-torque claim.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/swept-volume-all-tasks.png" alt="Swept-volume comparison across cardiac, near-to-far, cross-waist, and hydroelastic tasks" loading="lazy" decoding="async"><figcaption><strong>Task-scale swept-volume comparisons</strong><span>The montage reports the recorded 3D occupancy and total swept volume for cardiac, near-to-far, cross-waist, and 15/35/50 N hydroelastic tasks. The cardiac panel is marked partial in the source record; these volumes are geometric comparisons of the recorded windows, not a claim that every task completed successfully.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/hydro15-overview-raw.png" alt="Raw Hydro 15 N torque and probe-tip position overview" loading="lazy" decoding="async"><figcaption><strong>Hydro 15 N raw dynamics</strong><span>Raw applied joint-effort traces are plotted with probe-tip position and task events. The dense regions and short spikes are retained because they show contact transients and reorientation timing that a smoothed trend would hide.</span></figcaption></figure>
          <figure class="evidence-card evidence-wide"><img src="/media/results/hydro15-overview-smoothed.png" alt="Filtered Hydro 15 N torque and probe-tip position overview" loading="lazy" decoding="async"><figcaption><strong>Hydro 15 N filtered trend</strong><span>The same run after a 2 Hz zero-phase display filter makes the sustained 7-DoF versus 9-DoF torque trend easier to compare. Filtering is for visualization; it does not replace the raw signal or turn this contact trace into a validated mechanism decomposition.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/hydro15-force.png" alt="15 N hydroelastic force trace with raw and filtered signals" loading="lazy" decoding="async"><figcaption><strong>Force tracking and contact transients</strong><span>The upper trace is the controller feedback used for force regulation; the lower trace shows raw Newton physics-step force. The nominal target is 15 N, with feedback MAE reported separately from raw peaks.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/human-travel.png" alt="Near and far human travel comparison" loading="lazy" decoding="async"><figcaption><strong>Longitudinal scan travel</strong><span>Summing absolute J1–J7 changes over the pitch/axial reorientation stages gives 10.355 rad for 7-DoF and 3.228 rad for 9-DoF, making the proximal-motion shift visible joint by joint.</span></figcaption></figure>
        </div>
        <div class="evidence-links"><a href="/docs/evidence/CLAIM_EVIDENCE_MATRIX.md">Claim–evidence matrix</a><a href="/docs/evidence/SWEPT_VOLUME_METHODS.md">Swept-volume methods</a><a href="/docs/evidence/PAPER_DRAFT_EN.md">Methods and limitations</a></div>
      </div>
    </section>`;

  const injectResearchStory = () => {
    if (document.querySelector("#contact-suite")) return;
    // The exported Next payload still contains the old rationale node for hydration;
    // remove that internal planning section before the public story is displayed.
    document.querySelector("section.rationale")?.remove();
    document.querySelector("#evidence")?.remove();
    const application = document.querySelector("#application");
    if (application) application.insertAdjacentHTML("afterend", contactSuite + evidenceLibrary);
    const nav = document.querySelector(".site-nav > div");
    if (nav && !nav.querySelector("a[href='#evidence']")) {
      nav.insertAdjacentHTML("beforeend", '<a href="#evidence">Detailed</a>');
    }
  };

  const initialize = () => {
    hydrateDemoVideos();
    enableDeferredUrdf();
  };

  window.setTimeout(() => {
    injectResearchStory();
    initialize();
    let refreshQueued = false;
    const observer = new MutationObserver(() => {
      if (refreshQueued) return;
      refreshQueued = true;
      window.requestAnimationFrame(() => {
        refreshQueued = false;
        initialize();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, 1400);
})();
