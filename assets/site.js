(() => {
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

  const paperFraming = `
    <section class="paper-abstract" id="paper-framing">
      <div class="container paper-abstract-grid">
        <div>
          <p class="section-kicker">Paper framing</p>
          <h2>Localize tool reorientation near the endpoint</h2>
          <div class="paper-abstract-copy">
            <p>Seven-degree-of-freedom manipulators are kinematically sufficient for arbitrary tool poses, yet local tool reorientation can still move the shoulder, elbow, and forearm through large arcs. RuggedizedWrist adds two compact distal axes so the same orientation change can be performed close to the tool.</p>
            <p>We quantify this trade-off through task-relevant reorientation coverage under a bounded proximal-arm motion budget, then test the less intuitive dynamic question: whether replacing motion of large proximal links with a lightweight wrist reduces motion-related arm demand despite added mass and coupling.</p>
            <p>Across six deterministic free-space trials, the active wrist reduces proximal dynamic torque RMS by <strong>97.8%</strong>, proximal joint travel by <strong>99.25%</strong>, and peak whole-system kinetic energy by <strong>31.9%</strong>. Gravity-inclusive total motor torque increases by <strong>11.3–11.7%</strong>, making the system-level trade-off explicit. Contact-rich recordings and force traces are included as a separate exploratory evaluation with its gates and limitations reported.</p>
          </div>
          <div class="paper-abstract-meta" aria-label="Key study metrics">
            <div><strong>5.155 → 94.964%</strong><span>CARE coverage at an 8° proximal budget across the evaluated methods</span></div>
            <div><strong>0.092 mm</strong><span>maximum reported TCP position error in the deterministic S2/S3 trials</span></div>
            <div><strong>15 N</strong><span>surface-normal contact objective used in the rendered task recordings</span></div>
          </div>
        </div>
        <figure class="paper-abstract-figure">
          <img src="/media/results/assembly.png" alt="RuggedizedWrist hardware assembly with the distal wrist and tool attachment" loading="eager">
          <figcaption>Hardware artifact and simulation evidence are presented together so the mechanism, protocol, and measured effects remain connected.</figcaption>
        </figure>
      </div>
    </section>`;

  const evaluationMap = `
    <section class="evaluation-map" id="evaluation-map">
      <div class="container">
        <p class="section-kicker">Evaluation map</p>
        <h2>Four linked measurements explain the benefit</h2>
        <p class="evaluation-intro">The page follows the paper’s causal order: first establish where distal redundancy is useful, then show how it changes proximal motion and dynamics, and finally test the influence of mounting direction and contact conditions.</p>
        <div class="evaluation-grid">
          <article class="evaluation-card"><img src="/media/results/care-heatmap.png" alt="CARE reorientation coverage heatmap" loading="eager"><div><h3>01 · Kinematic coverage</h3><p>The CARE envelope measures feasible orientation change while constraining proximal motion. The 8° budget covers <strong>5.155%, 34.447%, 87.209%, and 94.964%</strong> across the four evaluated strategies.</p></div></article>
          <article class="evaluation-card"><img src="/media/results/s2-locked.png" alt="Locked-wrist S2 dynamic comparison" loading="eager"><div><h3>02 · Proximal motion</h3><p>Matched starts and the same axial 0° → 90° → 0° trajectory isolate the motion moved from the primary arm to the distal wrist. Proximal travel falls by approximately <strong>99.25%</strong>.</p></div></article>
          <article class="evaluation-card"><img src="/media/results/s3-speed.png" alt="S3 speed scaling dynamics" loading="eager"><div><h3>03 · Dynamic demand</h3><p>Signed proximal dynamic contributions and speed scaling show a <strong>97.8%</strong> RMS reduction, while the separate gravity-inclusive total torque measure increases <strong>11.3–11.7%</strong>.</p></div></article>
          <article class="evaluation-card"><img src="/media/results/mount-comparison.png" alt="Vertical and horizontal mount configuration comparison" loading="eager"><div><h3>04 · Mounting and contact</h3><p>Vertical and horizontal mounts are shown as configuration comparisons. Hydroelastic traces and task recordings make contact behavior visible without treating exploratory gates as aggregate success rates.</p></div></article>
        </div>
      </div>
    </section>`;

  const contactSuite = `
    <section class="contact-suite" id="contact-suite">
      <div class="container">
        <p class="section-kicker">Contact-rich suite</p>
        <h2>Rendered tasks, force traces, and honest boundaries</h2>
        <p class="contact-intro">The synchronized videos above show the matched-view comparisons. These additional panels expose the task geometry and hydroelastic signals used to inspect near/far travel, force tracking, and the effect of changing the wrist–tool configuration.</p>
        <div class="contact-grid">
          <figure class="contact-card"><img src="/media/results/human-travel.png" alt="Near and far human travel comparison" loading="eager"><figcaption><strong>Near / far travel</strong><span>Human-proximity travel comparison for the longitudinal scan configuration.</span></figcaption></figure>
          <figure class="contact-card"><img src="/media/results/hydro35-force.png" alt="35 N hydroelastic force trace" loading="eager"><figcaption><strong>Hydroelastic force at 35 N</strong><span>Representative force response from the contact-task sweep.</span></figcaption></figure>
          <figure class="contact-card"><img src="/media/results/hydro50-force.png" alt="50 N hydroelastic force trace" loading="eager"><figcaption><strong>Hydroelastic force at 50 N</strong><span>Higher-force trace retained as an explicit stress case rather than a success claim.</span></figcaption></figure>
        </div>
      </div>
    </section>
    <section class="limitations" id="limitations">
      <div class="container limitations-grid"><div><p class="section-kicker">Scope and limitations</p><h2>Read the evidence at the right level</h2></div><p>The free-space S2/S3 results are the controlled mechanism study. The contact-rich panels are exploratory protocol traces: the current evidence bundle records unmet hydro/orientation gates for some conditions and an aborted cardiac run. They are included to make the evaluation inspectable, while claims about contact success remain appropriately bounded.</p></div>
    </section>`;

  const evidenceLibrary = `
    <section class="section evidence" id="evidence">
      <div class="container">
        <div class="section-heading"><p class="section-kicker">Evidence library</p><h2>Mount variants, coverage, and new dynamics</h2><p>The selected panels make the evidence trail readable without exposing author identity. They include the revised horizontal mount comparison, the CARE envelope, matched-start dynamics, and force traces from the contact scans.</p></div>
        <div class="evidence-grid">
          <figure class="evidence-card evidence-wide"><img src="/media/results/mount-comparison.png" alt="CARE comparison of baseline vertical and new horizontal wrist mounts" loading="eager"><figcaption><strong>Mount comparison</strong><span>Baseline vertical vs. revised horizontal assembly; reported as a configuration comparison.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/care-heatmap.png" alt="Contact-Anchored Reorientation Envelope heatmap" loading="eager"><figcaption><strong>CARE envelope</strong><span>Distal-weighted and arrival-aware strategies broaden the sampled feasible region.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/care-coverage.png" alt="CARE coverage as a function of proximal motion budget" loading="eager"><figcaption><strong>Coverage vs. motion budget</strong><span>8° budget coverage: 5.155%, 34.447%, 87.209%, and 94.964%.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/s2-active.png" alt="Active-wrist dynamic torque decomposition" loading="eager"><figcaption><strong>S2 mechanism</strong><span>Signed proximal dynamic contributions with the distal wrist active.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/s3-speed.png" alt="S3 speed scaling comparison" loading="eager"><figcaption><strong>S3 speed scaling</strong><span>Dynamic torque falls with distal allocation; total motor torque is reported separately.</span></figcaption></figure>
          <figure class="evidence-card"><img src="/media/results/hydro15-force.png" alt="15 N hydroelastic force trace" loading="eager"><figcaption><strong>Contact scan trace</strong><span>Representative 15 N hydroelastic force trace; contact-task limitations remain documented.</span></figcaption></figure>
        </div>
        <div class="evidence-links"><a href="/docs/evidence/CLAIM_EVIDENCE_MATRIX.md">Claim–evidence matrix</a><a href="/docs/evidence/SWEPT_VOLUME_METHODS.md">Swept-volume methods</a><a href="/docs/evidence/PAPER_DRAFT_EN.md">Methods and limitations</a></div>
      </div>
    </section>`;

  const addOnce = (selector, html, position, reference) => {
    if (document.querySelector(selector)) return;
    reference.insertAdjacentHTML(position, html);
  };

  const injectResearchStory = () => {
    if (document.querySelector("#paper-framing")) return;
    const hero = document.querySelector(".hero");
    const application = document.querySelector("#application");
    if (hero) hero.insertAdjacentHTML("afterend", paperFraming + evaluationMap);
    if (application) application.insertAdjacentHTML("afterend", contactSuite + evidenceLibrary);
    const nav = document.querySelector(".site-nav > div");
    if (nav && !nav.querySelector("a[href='#evaluation-map']")) {
      nav.insertAdjacentHTML("beforeend", '<a href="#evaluation-map">Evidence</a>');
    }
  };

  document.querySelectorAll("[data-sync-group]").forEach(synchronize);
  window.setTimeout(injectResearchStory, 1400);
})();
