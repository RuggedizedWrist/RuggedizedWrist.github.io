# Swept-volume figures

Each condition has the same figure layout: a 3D swept occupancy on the left and its total occupied volume on the right. Red is 7DoF and green is 9DoF. Each task has separate 7DoF and 9DoF figures plus an overlaid comparison, exported individually as PNG (300 dpi) and editable SVG. All 21 figures are also collected into one PDF, one figure per page.

- [All six task comparisons](all_tasks_comparison.png)
- [All figures, including the home-entry supplement](swept_volume_all_figures.pdf)
- [Numeric results and bounding coordinates](volume_summary.csv)
- [Reconstruction and scaling verification](validation.json)

## Metric

The original experiment's `proximal_body_center_swept_aabb_volume_m3` is retained in the CSV as an audit reference. The plotted metric is a geometry-informed swept occupancy volume.

The figures reconstruct `link1` through `link7` body-frame origins from measured joint angles using the kinematics-only URDF supplied in `care9dof_hardware_algorithm_20260907.zip`. The Rizon 4S collision meshes in `assets/flexiv_rizon4s_collision/` are placed at every recorded kinematic pose; the documented v6 wrist, pitch-link, and linear-probe envelopes are placed from their corresponding frames. Adjacent link origins are also densely interpolated and dilated by a conservative radius to cover motion between samples. The occupied voxels therefore form an irregular mesh-and-envelope union rather than a rectangular AABB. The supplied Onshape CAD URDF remains separately documented because its exact registration to the recorded v6 frames is unavailable.

For each condition, all recorded samples are pooled. Collision mesh points, wrist/probe envelope points, and adjacent-link interpolation are voxelized and dilated with a spherical clearance radius; the volume is `occupied_voxels * voxel_size^3`, in cubic meters. The bars use this occupancy volume; the CSV also preserves the original reported AABB volume for audit.

The 3D panel shows sampled occupied voxels, reconstructed center paths, five faint arm configurations, and final centers. Only displayed paths/voxels are thinned for legibility; the volume uses every input sample.

## Coverage

| Task | Figure folder | Recorded window |
| --- | --- | --- |
| Cardiac | [Task 1](tasks/cardiac/) | All 2,938 recorded task samples; aborted during surface scan. Not a completed task volume. |
| Near-to-far | [Task 2](tasks/near_to_far/) | All synchronized task samples, matching the original metric window. |
| Cross-waist | [Task 3](tasks/cross_waist/) | All synchronized task samples, matching the original metric window. |
| Hydroelastic 15 N, kh=1e9 | [Hydro 15 N](tasks/newton_hydroelastic_stable_15n/) | All synchronized task samples. |
| Hydroelastic 35 N, kh=1e9 | [Hydro 35 N](tasks/newton_hydroelastic_stable_35n/) | All synchronized task samples. |
| Hydroelastic 50 N, kh=4e9 | [Hydro 50 N](tasks/newton_hydroelastic_stable_50n/) | Complete recording; not all validation gates passed. |
| Hydroelastic 15 N, kh=1e7 | [Home-entry supplement](supplement/newton_hydroelastic_15n_kh1e7_home_entry_only/) | Only the separately recorded Home-entry motion. No scan time series was saved after contact acquisition timed out. A full task swept volume is unavailable. |
| CARE, baseline and horizontal variants | No dynamic swept-volume figure | CSV rows are independent static IK target solutions, including unsuccessful solves and several 9DoF methods. They are not a measured motion trajectory. Connecting them in row order would fabricate motion. |

Home-entry records are not mixed into the six task windows. The soft-material Home-entry supplement is deliberately excluded from the six-task overview. Task accuracy and contact validation are separate from having a complete recording; these volume figures do not establish equal task performance.

## Common scales

- Coordinate frame: robot base frame, with the same origin and orientation for every condition.
- X: -0.1 to 0.9 m. Y: -0.4 to 0.6 m. Z: 0.0 to 1.0 m.
- Each spatial axis spans 1.0 m with equal geometric scale.
- Orthographic camera: elevation 24 degrees, azimuth -58 degrees.
- Volume bars: 0.0 to 0.30 cubic meters, identical ticks and bar width.
- Figure size: 11.0 by 6.3 inches. PNG resolution: 3300 by 1890 pixels.

## Reproduction

Run `plot_swept_volumes.py` with Python, NumPy, pandas, SciPy, Matplotlib and Pillow installed. The script reads the original result tree and URDF directly from the supplied ZIP, checks its reconstruction against the archived references and summary metrics, then rebuilds all outputs. Raw experiment files are unchanged.

```bash
python swept_volume_figures/plot_swept_volumes.py
```

`validation.json` records source hashes, exact settings, and numerical checks. `volume_summary.csv` includes the occupancy volume, AABB audit volume, reported volume where available, and each recorded time window.
