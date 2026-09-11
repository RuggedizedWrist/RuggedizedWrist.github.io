# Simulation study: methods, results, and limitations

Manuscript working draft, assembled 2026-09-08. This document combines the final corrected horizontal J9-v6 experiments with the subsequent S1/S2/S3 supplement. It reports simulations, not hardware measurements. Numerical results are descriptive; no independent repeated-trial statistics are available. Figure labels below are suggested manuscript labels, not an assertion that all panels should appear in the main text.

## 1. Study objective and experimental organization

We investigated whether a two-axis distal wrist can improve contact-anchored probe reorientation and reduce proximal-arm motion and dynamic torque. We separated three questions: kinematic coverage (S1/CARE), the mechanism of proximal torque redistribution (S2), and its dependence on movement duration (S3). Contact scans on a rigid torso and a hydroelastic phantom provided complementary task-execution demonstrations.

The comparison was between a locked-wrist seven-DoF execution strategy and an active-wrist nine-DoF strategy with distal-priority redundancy allocation. Both retained the arm, right-angle adapter, wrist hardware, and probe. Active-wrist control was not assumed to reduce total motor torque; gravity-inclusive total torque and motion-dependent torque were evaluated separately.

## 2. Robot, frames, and simulation

The model comprised a Flexiv Rizon4s arm (J1–J7), a transverse distal tilt joint (J8), and an axial output joint (J9). The final asset revision was `horizontal_v6_centered_j9_fixed_housing`. The J9 motor housing was attached to the J8 link, while the output fixture and probe rotated about the corrected central J9 axis. The validated mounting transform was

\[
{}^F R_W=\begin{bmatrix}0&-1&0\\0&0&1\\-1&0&0\end{bmatrix},\qquad
{}^F t_W=[-0.00005,-0.0028,0.0638993]^T\ \mathrm{m}.
\]

The probe contact point, rather than the flange, defined the task:

\[
{}^B T_C(q)={}^B T_F(q_{1:7}){}^F T_W{}^W T_C(q_8,q_9).
\]

For a body-fixed TCP offset \(r\), the translated Jacobian was
\(J_{v,C}=J_{v,E}-[R_Er]_\times J_{\omega,E}\). Thus, the arm could compensate the contact-point displacement induced by wrist rotation; it was not artificially fixed during active-wrist execution.

Human-torso scans used Isaac Sim/PhysX. Hydroelastic scans and the new free-space dynamics study used Newton with MuJoCo Warp on an NVIDIA RTX 5090. CARE used CPU kinematics. The outer control interval was 4 ms; Newton used four 1 ms substeps and `implicitfast` integration. Geometric reference paths were not replayed by overwriting joint states: actual trajectories resulted from torque commands and physical integration after initialization.

The aligned scan Home was
\([0.238909299,-0.709116786,0.337653128,1.449275634,-1.462272070,-0.530977864,0.644193515,0,0]\) rad.
The phantom was translated, not rotated. Scan entry from Home was recorded separately and excluded from formal scan metrics. The matched-start free-space study used a different, explicitly documented experimental starting configuration (Section 6), without changing this Home.

![Fig. 1: corrected assembly in the recorded hydroelastic task](../figures/main/F01_assembly_actual.png)

## 3. Contact control and distal-priority allocation

The surface task frame allocated normal translation to force regulation and tangential translation plus orientation to motion control:

\[
S_m=\operatorname{diag}(1,1,0,1,1,1),\qquad
S_f=\operatorname{diag}(0,0,1,0,0,0).
\]

These selectors followed the neutral surface-normal frame, not the tilted probe axis. Hydroelastic scans used non-inertia-decoupled impedance and proportional force feedback through Isaac Lab's operational-space controller (OSC):

\[
\tau=J^T\bar S_m(K_pe-K_dJ\dot q)
+J^T\bar S_f[w_d+K_f(w_d-\hat w)]+\tau_{\rm null}.
\]

The controller parameters were matched within each hydroelastic force condition: \(K_p=[1200,1200,0,240,240,240]\), damping ratios \([2,2,1,2,2,2]\), normal force gain 0.02, and nullspace stiffness/damping ratio 5/3 with an identity nullspace metric. Solver-native gravity compensation was enabled; OSC did not add gravity a second time. The logged legacy hydroelastic command therefore excludes gravity compensation and is not the total motor torque.

Force feedback used a four-sample moving mean followed by a first-order filter, \(\hat f_k=0.5\bar f_k+0.5\hat f_{k-1}\). A bounded normal-velocity correction used \(b_n=10\ \mathrm{N\,s/m}\), limited to 20% of nominal force. Raw contact force and filtered feedback were retained separately, except in the aborted Cardiac branch where the raw field was a feedback alias.

Joint-limit-aware weighted IK generated continuous posture references:

\[
J_W^\#=W^{-1}J^T(JW^{-1}J^T+\lambda^2I)^{-1},\qquad
\Delta q=J_W^\#e+(I-J_W^\#J)b.
\]

For the scans, base proximal/distal motion costs were 1/4 during translation and 15/0.12 during reorientation. Lower distal cost favored wrist motion; joint-limit penalties increased costs near limits. A nullspace posture objective coordinated this reference with TCP control. Human-torso scans used inertia-decoupled OSC and a different projected-posture branch; their damping and nullspace designs were not identical across conditions. They therefore constitute system comparisons, not pure DoF-only ablations. Exact task-specific gains, limits, geometry, and state-machine settings are retained in the detailed methods archive.

## 4. S1: Contact-Anchored Reorientation Envelope (CARE)

CARE was a kinematic benchmark, not an impedance-control or contact-stability experiment. We sampled 525 torso contacts and 143 orientations per contact: tilt from −25° to +25° in 5° increments and axial rotation from −90° to +90° in 15° increments. Each method evaluated 75,075 targets.

Four methods were evaluated: locked-arm IK, generic nine-axis IK, distal-weighted IK (proximal/distal costs 25/1), and reorientation-aware arrival selection followed by the same distal-weighted IK. The proposed method generated arrival candidates from Home and six joint perturbations, evaluated a 3 × 5 coarse orientation grid for each candidate, then ranked candidates by coverage, clearance, and proximal displacement. This is a finite candidate search with local numerical IK, not a globally optimal planner. The coarse and evaluation grids overlap and do not constitute an independent held-out test.

Let \(d_a=\sqrt{\frac17\sum_{j=1}^7(q_j-q_{j,\mathrm{arrival}})^2}\). A CARE target required pose error within 2 mm/2°, \(d_a\le8°\), and nonnegative geometric clearance proxy. The budget curve was

\[
\mathrm{Coverage}(B)=\frac{\#\{t:\mathrm{pose\ feasible},\ c_{\rm proxy}\ge0,\ d_a\le B\}}{75075}.
\]

All sampled failures remained in the denominator. Clearance used sampled geometric envelopes rather than continuous mesh collision checking. Each method used its own arrival configuration; proposed-arrival results are consequently not a matched-start causal DoF comparison.

At the 8° budget, coverage was 5.155%, 34.447%, 87.209%, and 94.964%, respectively. Proposed arrival improved coverage by 7.755 percentage points over distal-weighted IK. Compared with the original-mount proposed system, coverage increased from 88.503% to 94.964%; the Home configuration also differed between these assemblies, so this is not an isolated mounting-angle ablation.

![Fig. 2a: CARE orientation-grid heatmaps](../figures/main/F02a_CARE_heatmap.png)

![Fig. 2b: S1 coverage versus proximal displacement budget](../figures/main/F02b_S1_coverage.png)

## 5. Contact-task demonstrations

Near-to-far scanned 160 mm and then executed −35° tilt, return, and +90° axial rotation; its formal window was 26.8 s. Cross-waist scanned 144 mm and executed +30° tilt, return, and +90° axial rotation in a 28.4 s formal window. Neither task ends with a complete axial return loop. Cardiac was designed for a longer scan/reorientation sequence but aborted before reorientation; it is retained as a failed attempt.

Hydroelastic contact used rigid geometry with compliant pressure-field-based finite-area contact, not a deforming mesh or FEM tissue model. Conceptually, pressure increases with penetration depth, \(p\sim k_hd\), and force/moment result from integration over the contact area. The effective response also depends on discretization and the constraint solver. Phantom \(k_h\) was \(10^9\ \mathrm{N/m^3}\) at 15 and 35 N, and \(4\times10^9\) at 50 N; probe \(k_h=10^{11}\). These are numerical contact parameters, not identified human-tissue elastic moduli.

The trajectory traveled from the phantom center to an elliptical loop, spanning 280 × 520 mm, and returned to the center. Four stationary events comprised two +30° tilt excursions and two +45° axial excursions, each returning to neutral. One formal cycle lasted 121 s. This samples a wide path, not the entire two-dimensional phantom area. A looping GIF repeats the recording and does not establish indefinitely stable physical execution.

| Task | Completion / limitation | Proximal reorientation travel reduction | Command-torque RMS reduction |
|---|---|---:|---:|
| Cardiac | Aborted before reorientation | Not valid | Not valid |
| Near-to-far | Complete; both below supplementary 5° orientation reference | 68.82% | −4.32% |
| Cross-waist | Complete; active exceeds 5° reference | 84.58% | −2.45% |
| Hydro 15 N | Complete; both exceed 5° reference | 63.94% | 1.43% |
| Hydro 35 N | Complete; both exceed 5° reference | 63.99% | 1.74% |
| Hydro 50 N | Complete; orientation and original force-peak criteria unmet | 63.79%, descriptive | Not a validated benefit |

Negative reduction denotes an increase. The 5° reference was supplementary, not a retrospectively claimed common preregistered criterion. Raw versus filtered-force error rankings can differ: at 15 N the active condition had lower filtered MAE but slightly higher raw MAE. Cross-load hydroelastic comparisons also changed \(k_h\) and/or solver impedance settings. Soft-phantom trials at \(10^7\) and \(10^8\ \mathrm{N/m^3}\) did not yield valid complete scans.

![Supplement: hydroelastic 15 N force trace](../figures/supplementary/FS04_hydro15_force.png)

## 6. S2/S3: matched-start free-space reorientation

The nominal TCP position was fixed while axial orientation followed 0°→+90°→0°. Both conditions used the same actual initial J1–J7 configuration and J8/J9 zero, identical physical hardware (compiled mass approximately 22.4881 kg), gains, and effort/slew limits. The locked condition replaced wrist revolute joints with fixed joints rather than deleting distal bodies.

The original aligned Home did not provide a feasible full locked-arm +90° branch. An experimental start was selected using geometry alone: the first archived 15 N scan candidate at approximately 0/30/60/90 s with a feasible path and more than 10° planned joint-limit margin. The selected 60 s configuration was
\([1.324500442,-0.679470718,-0.542459071,1.573372364,-0.774993479,-0.545188725,0.790012062,0,0]\) rad.
Its source CSV, zero-based row 15000, and hash are retained. Torque was not used to select the starting pose. Home-to-trial preparation was outside the measurement window.

Each condition generated one 201-knot geometric joint path \(q_r(s)\) satisfying the common probe-level trajectory; that same path was reused at all three speeds. Cubic-spline interpolation and quintic time scaling gave

\[
s(u)=10u^3-15u^4+6u^5,\quad
\dot q_r=q_r'(s)\dot s,\quad
\ddot q_r=q_r''(s)\dot s^2+q_r'(s)\ddot s.
\]

The one-way segment duration \(T\) was 8, 4, or 2 s. A trial included a 5 s static baseline, \(2T\) s motion, and a 2 s final hold. The baseline mean used its final 2 s. Formal results comprise one deterministic run per condition and speed (six runs), not 3–5 independent repetitions.

The free-space controller used full inertia-decoupled six-dimensional OSC, matching reference-velocity feedback, a moving nullspace reference, and inverse-dynamics reference-acceleration feedforward:

\[
\Lambda=(JM^{-1}J^T)^{-1},\quad N_\tau=I-J^T\Lambda JM^{-1},
\]
\[
\tau_{\rm cmd}=g+J^T\Lambda[K_xe+D_x(v_r-J\dot q)]
+N_\tau M[K_n(q_r-q)+D_n(\dot q_r-\dot q)]
+M\ddot q_r+c-\tau_{\rm passive}.
\]

Both conditions used \(K_x=[400,400,400,160,160,160]\), damping ratio 1, nullspace stiffness 8 and damping ratio 1, proximal armature 0.1 kg·m²/joint, and active wrist armature 0.5 kg·m²/joint. In this inertia-decoupled mode, task gains are acceleration-feedback gains, not directly translational stiffness in N/m. Engine gravity compensation was disabled; gravity was included explicitly in motor command.

Crucially, actual compiled passive damping and native actuator forces were zero. The original summary field `wrist_passive_damping=4` records an ineffectual configuration request, not an applied physical damping. Compiled models and capture metadata take precedence. Feedback damping remained in the explicit controller. These inertial and friction assumptions were not identified from hardware.

## 7. Torque decomposition, energy, and verification

For proximal coordinates \(a\) and distal coordinates \(w\), signed proximal motor torque was decomposed without double counting:

\[
\tau_{m,a}=M_{aa}\ddot q_a+M_{aw}\ddot q_w+g_a+c_{a,\rm arm}+c_{a,\rm wrist}
-\tau_{\rm passive,a}-\tau_{\rm constraint,a}-\tau_{\rm external,a},
\]
\[
c_{a,\rm arm}=c_a(q,[\dot q_a,0]),\quad
c_{a,\rm wrist}=c_a(q,\dot q)-c_a(q,[\dot q_a,0]).
\]

The wrist acceleration term and velocity remainder define coupling contributions; they must not be added again to the already complete \(M\ddot q+c\). Constraint force may include contact, limits, and friction, and is not automatically a pure contact-load term. RMS values of components are not additive: signed components were summed before RMS calculation.

Native pre-integration states and corresponding solver accelerations/generalized forces were recorded. Independent CPU double-precision dynamics from the saved compiled model checked

\[
r=M\ddot q+b-\tau_{\rm passive}-\tau_{\rm actuator}-\tau_{\rm applied}
-\tau_{\rm constraint}-\tau_{\rm external}.
\]

This used engine accelerations, not second differences of sparse joint-position logs. The free-space criteria required completion, TCP errors below 2 mm/2°, joint-reference error below 1°, joint-limit margin above 2°, no effort/slew/velocity saturation, and maximum absolute force-balance residual below 0.02 Nm.

Only outbound and return intervals entered the primary motion metrics. Capacity-normalized proximal torque was

\[
\eta_\tau=\sqrt{\frac1{7N}\sum_{k,j\le7}(\tau_j[k]/\tau_{j,\max})^2},
\quad\tau_{\max}=[123,123,64,64,39,39,39]\ \mathrm{Nm}.
\]

Total motor torque and the dynamic term \(M\ddot q+c\) were reported separately. Baseline-subtracted torque was not called pure inertia, because gravity changes with configuration. Further metrics were cumulative absolute proximal joint travel, full-system kinetic energy \(E_K=\frac12\dot q^TM\dot q\), and positive/negative/net/absolute joint mechanical work from \(P_j=\tau_j\dot q_j\). Energy includes model armature and matrix cross terms; mechanical work is not electrical consumption. Complete actual joint states are archived for subsequent mesh-based swept-volume analysis; that analysis has not been completed, and a body-center AABB is only a geometric proxy.

## 8. S2/S3 results and mechanism

All six formal free-space trials met the tracking, saturation, and dynamics checks. Across these runs, maximum TCP position and orientation errors were 0.09156 mm and 0.03710°, respectively; maximum independent force-balance residual was \(3.0641\times10^{-5}\) Nm.

| One-way T | Dynamic proximal RMS reduction | Gravity-inclusive total RMS reduction | Proximal travel reduction | Peak whole-system kinetic-energy reduction |
|---|---:|---:|---:|---:|
| 8 s | 97.763% | **−11.705%** | 99.260% | 31.913% |
| 4 s | 97.983% | **−11.636%** | 99.256% | 31.917% |
| 2 s | 97.976% | **−11.328%** | 99.249% | 31.863% |

At T=2 s, normalized dynamic RMS was 0.00670880 versus 0.000135768 (locked/active), whereas total motor RMS was 0.222880 versus 0.248128. The proximal acceleration contribution decreased from 0.0139790 to 0.000140529. Added wrist acceleration/velocity coupling contributions were small (approximately \(6.638\times10^{-6}\) and \(2.524\times10^{-6}\), respectively). These normalized component RMS values do not sum to the total.

The active wrist substantially reduced the proximal dynamic component, but did not reduce total motor torque in this configuration. The locked arm traversed configurations with a lower aggregate gravity burden, while the active system largely maintained its initial proximal posture. Since hardware mass was identical, the gravity difference cannot be attributed to added hardware mass in the active condition.

Both conditions were approximately consistent with dynamic torque scaling as \(1/T^2\); the locked arm had a larger coefficient, not evidence of a different scaling exponent. The absolute dynamic-torque gap increased with speed, while percentage reduction remained about 98%. These results do not predict that total torque will necessarily become favorable at untested speeds.

At T=2 s, peak full-system kinetic energy was 0.78666/0.53601 J, and positive full-system mechanical work was 63.4905/1.80289 J. Mechanical work includes gravitational potential-energy exchange and does not establish an electrical-energy saving.

![Fig. 3a: locked-arm signed dynamic contributions at T=2 s](../figures/main/F03a_S2_locked_dynamic.png)

![Fig. 3b: active-wrist signed dynamic contributions at T=2 s](../figures/main/F03b_S2_active_dynamic.png)

![Fig. 4: speed scaling including dynamic and total torque](../figures/main/F04_S3_speed_scaling.png)

## 9. Contact-decomposition diagnostic and limitations

The added 15 N contact-dynamics capture completed a 121 s loop, but its maximum force-balance residual was 0.241278 Nm, exceeding the 0.02 Nm threshold. Maximum orientation errors were approximately 6.600°/6.567°, exceeding the supplementary 5° reference. Its component plots are marked diagnostic only and are excluded from validated torque-mechanism conclusions. Finite constraint-solver convergence is a plausible contributor, not an experimentally confirmed root cause; no solver-precision convergence study was completed.

Other limitations include a single matched starting pose, one deterministic trial per condition/speed, uncalibrated masses/armature/friction, no electrical model, no complete continuous self-collision validation, and an idealized compliant phantom. CARE uses method-specific arrivals and sampled safety proxies. Several older contact tasks have unmet validation criteria. No hardware torque-reduction or human-contact safety claim follows directly from these simulations.

## 10. Recommended conclusion

The simulations demonstrate complementary kinematic and dynamic benefits of distal-priority probe reorientation: the proposed arrival strategy expanded the sampled low-proximal-motion envelope, and active-wrist execution substantially reduced proximal motion-dependent torque across the tested speeds. However, gravity-inclusive total proximal torque increased in the matched-start example. Distal redundancy therefore redistributes dynamic burden, while net motor-torque benefit remains dependent on posture, loading, and the physical model.

## Supporting material

See [figure captions](FIGURE_CAPTIONS_EN.md), [data dictionary and provenance](DATA_AND_REPRODUCIBILITY.md), [paper tables](tables/), and the two original detailed Chinese methods documents in `../docs/`. The package contains original negative results and raw traces, not only selected favorable plots. Background references in the historical methods document are reference leads; verify bibliographic details and the installed software versions before final submission.
