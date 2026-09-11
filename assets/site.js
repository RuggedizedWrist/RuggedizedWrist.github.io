(() => {
  if (window.__ruggedizedWristSiteInitialized) return;
  window.__ruggedizedWristSiteInitialized = true;
  const demoSources = {
    cardiac: ["/media/results/mount-v6/cardiac-7dof.mp4", "/media/results/mount-v6/cardiac-9dof.mp4"],
    longitudinal: ["/media/results/mount-v6/near-to-far-7dof.mp4", "/media/results/mount-v6/near-to-far-9dof.mp4"],
    waist: ["/media/results/mount-v6/cross-waist-7dof.mp4", "/media/results/mount-v6/cross-waist-9dof.mp4"],
  };
  const demoPlaybackRate = 1.5;

  const loadDemoVideo = (video) => {
    if (video.querySelector("source") || !video.dataset.src) return;
    const source = document.createElement("source");
    source.src = video.dataset.src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.load();
  };

  const demoObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const videos = entry.target.querySelectorAll("video");
          entry.target.dataset.inViewport = entry.isIntersecting ? "true" : "false";
          if (entry.isIntersecting) {
            videos.forEach((video) => {
              loadDemoVideo(video);
              video.playbackRate = demoPlaybackRate;
            });
            entry.target.__demoController?.play();
          } else {
            entry.target.__demoController?.pause();
          }
        });
      }, { rootMargin: "240px 0px", threshold: 0.05 })
    : null;

  const synchronize = (group) => {
    const videos = Array.from(group.querySelectorAll("video"));
    if (videos.length !== 2) return;
    let restarting = false;
    const play = () => {
      videos.forEach((video) => {
        video.playbackRate = demoPlaybackRate;
        video.play().catch(() => {});
      });
    };
    const pause = () => videos.forEach((video) => video.pause());
    const restart = () => {
      if (restarting) return;
      restarting = true;
      videos.forEach((video) => {
        if (video.readyState > 0) video.currentTime = 0;
      });
      window.requestAnimationFrame(() => {
        restarting = false;
        if (group.dataset.inViewport === "true") play();
      });
    };

    videos.forEach((video) => video.addEventListener("ended", restart));
    group.__demoController = { play, pause };

    window.setInterval(() => {
      if (restarting || group.dataset.inViewport !== "true") return;
      if (videos.some((video) => video.readyState < 2 || !Number.isFinite(video.duration))) return;

      const loopAt = Math.min(...videos.map((video) => video.duration)) - 0.12;
      if (videos.some((video) => video.ended) || videos[0].currentTime >= loopAt) {
        restart();
        return;
      }

      if (videos.some((video) => video.paused)) play();
      const drift = videos[1].currentTime - videos[0].currentTime;
      if (Math.abs(drift) > 0.12 && !videos[1].seeking) {
        videos[1].currentTime = Math.min(videos[0].currentTime, videos[1].duration - 0.12);
      }
    }, 100);
  };

  const hydrateDemoVideos = () => {
    document.querySelectorAll("[data-sync-group]").forEach((group) => {
      const sources = demoSources[group.dataset.syncGroup];
      if (!sources || group.dataset.videoReady === "true") return;

      const images = Array.from(group.querySelectorAll("figure > img"));
      if (images.length !== 2) return;

      images.forEach((image, index) => {
        const video = document.createElement("video");
        video.muted = true;
        video.loop = false;
        video.playsInline = true;
        video.preload = "metadata";
        video.poster = image.currentSrc || image.src;
        video.dataset.src = sources[index];
        video.defaultPlaybackRate = demoPlaybackRate;
        video.playbackRate = demoPlaybackRate;
        video.setAttribute("aria-label", image.alt);
        image.replaceWith(video);
      });

      group.dataset.videoReady = "true";
      group.dataset.playbackNote = "Corrected horizontal-v6 mounting · 1.5× playback";
      synchronize(group);
      if (demoObserver) demoObserver.observe(group);
      else {
        group.dataset.inViewport = "true";
        group.querySelectorAll("video").forEach(loadDemoVideo);
        group.__demoController?.play();
      }
    });
  };

  const enableUrdf = () => {
    const viewer = document.querySelector("urdf-manipulator[data-urdf]");
    if (!viewer || viewer.dataset.loadUiReady === "true") return;
    viewer.dataset.loadUiReady = "true";

    const canvas = viewer.closest(".urdf-canvas");
    const status = canvas?.querySelector(".viewer-status");
    const controls = viewer.closest(".urdf-viewer")?.querySelectorAll("input, .reset-joints") || [];
    controls.forEach((control) => { control.disabled = true; });
    if (status) status.innerHTML = "<span></span>Loading interactive wrist model…";

    viewer.addEventListener("geometry-loaded", () => {
      controls.forEach((control) => { control.disabled = false; });
      if (status) {
        status.classList.add("ready");
        status.innerHTML = "<span></span>Kinematic URDF loaded · 2 movable joints";
      }
    }, { once: true });

    viewer.setAttribute("urdf", viewer.dataset.urdf);
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
        <div class="section-heading"><p class="section-kicker">Detailed results</p><h2>Coverage, dynamics, mounting, and contact evidence</h2><p>Every figure is shown at its native aspect ratio with a reading guide. The captions distinguish kinematic coverage, proximal dynamic terms, gravity-inclusive motor torque, and exploratory contact traces.</p></div>
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
        <section class="methods-inline" id="methods" aria-labelledby="methods-title">
          <div class="methods-heading"><p class="section-kicker">Methods on this page</p><h3 id="methods-title">How the reported quantities were obtained</h3><p>The protocols and evidence boundaries are written here so every result can be interpreted without opening a separate document.</p></div>
          <div class="methods-grid">
            <article><strong>Corrected wrist mounting</strong><p>All demonstration videos use the <code>horizontal_v6_centered_j9_fixed_housing</code> assembly. The J9 motor housing is attached to J8, while the output fixture and probe rotate about the corrected central J9 axis. The validated wrist-to-flange translation is [−0.05, −2.8, 63.8993] mm.</p></article>
            <article><strong>CARE protocol</strong><p>The Contact-Anchored Reorientation Envelope samples 525 torso contact points and 143 orientations per point, for 75,075 targets. A target counts only when pose error is at most 2 mm and 2°, J1–J7 RMS motion stays within the stated budget, and geometric clearance is nonnegative. At the 8° budget, coverage is 5.155%, 34.447%, 87.209%, and 94.964% for the four methods.</p></article>
            <article><strong>Matched free-space protocol</strong><p>Locked- and active-wrist trials use the same physical model, initial state, and axial 0°→90°→0° trajectory. One deterministic run is reported at each 8, 4, and 2 s one-way duration. Motion-related dynamic torque is separated from gravity-inclusive total motor torque; the latter increases by 11.3–11.7% in these configurations.</p></article>
            <article><strong>Swept volume and contact scope</strong><p>Swept volume is the union of the arm geometry occupied over each recorded analysis window. Hydroelastic scans use a compliant pressure-field contact model rather than deforming tissue or a patient-specific finite-element model. Raw force, filtered feedback, motion, and pose gates are kept separate when determining whether a run supports a quantitative claim.</p></article>
          </div>
          <div class="protocol-table-wrap">
            <table class="protocol-table">
              <caption>Contact-rich task outcomes for the corrected mounting</caption>
              <thead><tr><th>Task</th><th>Recorded outcome</th><th>J1–J7 travel</th><th>Command-torque RMS</th></tr></thead>
              <tbody>
                <tr><td>Cardiac</td><td>Aborted before reorientation; diagnostic video only</td><td>Not claimed</td><td>Not claimed</td></tr>
                <tr><td>Near-to-far</td><td>Complete; both systems below the supplementary 5° orientation reference</td><td>68.82% lower</td><td>4.32% higher</td></tr>
                <tr><td>Cross-waist</td><td>Complete; active wrist exceeds the supplementary 5° reference</td><td>84.58% lower</td><td>2.45% higher</td></tr>
                <tr><td>Hydro 15 N</td><td>Complete; both systems exceed the supplementary 5° reference</td><td>63.94% lower</td><td>1.43% lower</td></tr>
                <tr><td>Hydro 35 N</td><td>Complete; both systems exceed the supplementary 5° reference</td><td>63.99% lower</td><td>1.74% lower</td></tr>
                <tr><td>Hydro 50 N</td><td>Force and orientation gates unmet; descriptive trace only</td><td>63.79% lower, descriptive</td><td>No validated benefit</td></tr>
              </tbody>
            </table>
          </div>
        </section>
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
      nav.insertAdjacentHTML("beforeend", '<a href="#evidence">Evidence</a>');
    }
    if (nav && !nav.querySelector("a[href='#methods']")) {
      nav.insertAdjacentHTML("beforeend", '<a href="#methods">Methods</a>');
    }
  };

  const initialize = () => {
    hydrateDemoVideos();
    enableUrdf();
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
