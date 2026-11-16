# OSMIUM exercise tracking: repair plan and status

## Implementation status — 16 November 2026

PC browser follow-up: fixed camera readiness being withheld until a body was detected, and fixed the script loader resolving before an existing script finished loading. Script download now has a timeout and can retry after failure. A successful model result with no person now shows Step into frame instead of Preparing camera. A headless browser with a fake webcam confirmed video playback, MediaPipe initialization, and the Start button. End-to-end counting with a person remains unverified; the demo-video test was interrupted.

This pass addresses the code paths most likely to prevent a phone camera session and adds timed on-screen exercise guidance. The earlier audit below is retained as historical context; its items 1–3 and 7 have received partial fixes. No claim of device success or validated exercise accuracy is made.

| Area | Implemented in source | Still required |
|---|---|---|
| Android native startup | Corrected the MediaPipe failure callback signature; removed a fragile UIManager view-name check; added 12-second camera-frame and 20-second pose-result timeouts; moved model initialization to the first analyzed frame so errors have a mounted listener; throttled image conversion/inference to about 10 fps. The generated Android `:pose-tracker:compileDebugKotlin` task succeeds. | Run a development/standalone build on an Android phone; inspect CameraX logs if startup fails. Expo Go cannot load this custom module. |
| Android Expo Go fallback | Removed duplicate camera opening via `camera_utils`; use one video stream; gave inline HTML a secure base URL; bound model loading to a 10-second failure; forward model/runtime/WebView errors; memoized WebView source to prevent reloads during session renders. | Verify on actual devices. This path still downloads MediaPipe from unpkg and Android WebView camera access may vary; the native development build is the primary phone test path. |
| Permission and session setup | Added retry and app-settings actions; re-check permission after returning to the app; Start waits for a real camera frame instead of permission alone; show Preparing camera while waiting. | Test denied, permanently denied, revoked, and granted permission on device. |
| Rep guidance | Runtime exercise sessions require a real three-second extension hold before a return can count. The visible Hold countdown uses the same pose timestamps, then changes to Release. Early return discards the partial rep and briefly displays Hold longer. Start-position guidance now names the exercise. | Validate the three-second hold and angle thresholds with real people and an appropriate exercise professional; verify the cue is readable at typical phone distance. |
| Set accounting | Removed nested state updates inside rep-count state updater. Set number and reps within the set now derive from the engine's authoritative total. | Device-check the 10th, 20th, and 30th rep transitions and save/reopen behavior. |
| Navigation | The visible Session back button ends and saves an active session through the normal result flow. | Intercept Android hardware/system back consistently; test navigation while the camera is active. |
| Automated verification | `npx expo lint` and `npx tsc --noEmit` pass. A new timed-hold detector test passes. The native pose module compiles in Gradle. | The full suite has 19 remaining UI/branding assertion failures (many expect old NOVEN text or old source layout); classify and update them. Camera hardware remains unverified here. |

The web browser path is a different camera implementation. Browser success must not be treated as proof of Android native success. The native module is Android-only; iOS tracking remains unsupported. Results and progress now label the derived percentage as rep-range similarity; it is not a form-quality or safety rating.

Scope: exercise selection, camera and pose pipeline, repetition counting, session controls, results, history, accessibility and shared settings. Yoga and meditation are deliberately excluded. This is a code review plus desk research; the camera was not tested on a physical device, and no clinical or accuracy claim is made.

## What the research suggests

Several independent implementations use broadly the same useful foundation already present in NOVEN: on-device pose estimation, per-exercise movement rules, confidence gating, and a finite-state rep counter. The improvement opportunity is to make the sensing and transitions honest, test the complete stream under varied conditions, and show uncertainty clearly.

- [IO_motion](https://github.com/bardia1122/IO_motion) is an Android example with hysteresis-based rep states, a One Euro landmark filter, key-joint confidence gating, body-scale normalization, per-rep data, offline video analysis, and selectable Lite/Full/Heavy models. Reuse these as patterns to evaluate, not as proof its accuracy generalizes to NOVEN or older adults.
- [dimsedra/squat-counter](https://github.com/dimsedra/squat-counter) distinguishes `ok`, `uncalibrated`, `no_pose`, and `error`; separates full and partial repetitions; uses visibility gates, calibration and smoothing. This is a strong reporting pattern: uncertain or failed input must not silently become zero reps or a valid result.
- The [React Native Nitro pose exercise module](https://github.com/Gautham495/react-native-nitro-pose-exercises) shows one possible cross-platform native architecture using Apple Vision on iOS and ML Kit on Android. Its landmark mapping and dependency/build implications need evaluation before adopting it.
- A [viewpoint-invariant repetition-counting study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10692053/) evaluated multiple views and concurrent movement, but used limited cohorts/datasets; the reported scores should not be transferred to NOVEN. It supports explicitly varying camera view and testing multiple movers/limb ambiguity.
- A recent [RGB-camera rehabilitation counting study](https://www.nature.com/articles/s41598-025-25674-1.pdf) combines temporal motion signals and peak detection, and discusses the tradeoffs of online versus whole-video counting. Candidate for later comparison if per-frame thresholds remain brittle; it is not an automatic replacement for a transparent, testable rep state machine.
- [Pūioio](https://arxiv.org/abs/2308.02420) studies on-device smartphone repetition counting with pose estimation, thresholds, optical flow, a state machine and counter. Use as a research reference for evaluating end-to-end latency and real-time constraints.
- Google’s [Pose Landmarker documentation](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker) distinguishes normalized image landmarks from world landmarks, documents confidence controls and live-stream modes, and exposes errors. Use actual visibility/presence and supported task states; do not manufacture landmarks or substitute defaults for missing confidence.
- Expo’s [SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/) is the compatibility authority for this Expo 57 app. The app’s custom pose module currently declares Android only, so Expo Go/web success cannot establish native iOS support.
- Community reports on [MediaPipe tracking jitter](https://www.reddit.com/r/computervision/comments/1kfm9ww/mediapipe_tracking_jitters_how_to_hide_bad_pose/) reinforce a practical failure mode: confidence alone can still accompany bad points. Treat geometric plausibility and temporal continuity as additional checks. This is anecdotal, not a benchmark.
- A [LinkedIn project write-up](https://www.linkedin.com/posts/colaweb_computervision-poseestimation-python-activity-7478853011851845633-gp1l) notes false first reps when a recording starts mid-movement and changing camera angles/occlusion. Its proposed “wait for valid start posture” pattern is already partly reflected in NOVEN readiness; preserve and test it. Treat portfolio claims as unverified.

## Audit findings in this codebase

### Confirmed from source

1. **Native fallback fabricates pose data.** `modules/pose-tracker/src/PoseTrackerView.tsx` synthesizes hips from shoulders with visibility `0.95`; missing visibility can default to `0.9`, and `visibility || 1` turns zero into full confidence. These values can reach the rep engine. Remove synthetic landmarks and confidence defaults. Missing required joints must make the frame untrusted.
2. **Fallback status/errors are misleading.** The fallback posts a camera error but the React Native message handler only processes landmarks; several initialization errors are swallowed and its “TRACKING ACTIVE” indicator is unconditional. It doesn’t reliably report lost pose when landmarks disappear. Route errors into the existing recovery path, distinguish loading/ready/lost/error, and only say active after valid pose frames.
3. **Set/rest control can be bypassed.** On the 10th rep the engine pauses and shows a rest card, while generic Resume can still be rendered. This may bypass the next-set transition and desynchronize rep/set state. Make phase the single source of truth and expose only actions valid in that phase.
4. **Displayed hold promise differs from the detector.** UI counts down a three-second hold from wall-clock time; detector config uses a small frame hold. The rep may count before the spoken/visual hold completes. Agree the movement requirement with a qualified exercise professional, then use one monotonic, pause-aware timing rule for detector, text and speech.
5. **Back navigation does not explicitly end/save an active exercise.** The shared activity back control calls `router.back()` directly. Define a safe exit flow for in-progress sessions, release camera/speech on all exits, and prevent duplicate saves.
6. **Camera permission check is only capability detection on web.** `getUserMedia` availability is treated as permission before the browser actually grants camera access. Handle the actual acquisition error and retry/OS/browser settings path.
7. **Web/fallback model dependencies require network.** One path loads MediaPipe from jsDelivr and another from unpkg. The fallback retries without a clear terminal error and swallows setup exceptions. Make loading bounded and visible; document whether only model/code are downloaded and whether frames stay local.
8. **Results are not a form correctness score.** The metrics code reports rep count, active ready-time, observed angle range, pace and a “consistency” derived from range variation. That does not establish good/safe form. Label it as a measured range-variation indicator or remove it until validated.
9. **Three exercise configs contain unvalidated geometry/threshold assumptions.** Knee extension, arm raise and sit-to-stand use 2D angles and fixed thresholds. The app code alone does not establish their accuracy for older adults, different chairs, camera positions or limited mobility.
10. **Platform coverage is incomplete in source.** The local native module config lists Android only and session permission logic rejects other native platforms. Decide supported platforms before claiming iOS parity.
11. **Tests currently need triage.** In the prior audit, `npm test` reported 15 failures out of 5,083 checks, including appearance/theme/button source assertions and unrelated session-history assertions. These failures do not prove exercise tracking failures; map each to stale textual assertions or real regressions and replace brittle source matching with behavior-level tests.

### Needs hands-on measurement

- Real rep false-positive and miss rates per exercise, device, camera placement and participant group.
- Low-end laptop/Android latency, dropped frames, heat, memory and battery under long sessions.
- Actual tracker recovery for dim light, clothing, mobility aids, chair height, partial occlusion, multiple people and camera movement.
- Whether the demo videos match the prescribed exercise, load on all supported platforms, and are usable offline.
- Whether save failure/restart/corrupted local storage and deleting history behave as the UI promises.

## Repair sequence

### Phase 1 — trustworthy sensor stream

1. Remove all inferred/synthetic landmarks and fake confidence defaults in both camera adapters. Preserve explicit zero confidence. Define one schema for tracked/lost/error plus per-joint visibility/presence.
2. Make the stream fail closed: reject missing/nonfinite/low-confidence required joints; add temporal plausibility checks for impossible jumps, stale timestamps and frozen frames. A bad frame pauses counting and resets partial phase progress without deleting completed reps.
3. Forward camera, model, permission and initialization errors through the existing `PoseTrackerFailureGate`. Add timeout and retry behavior. Stop camera/model work when screen blurs, ends or unmounts.
4. Replace unconditional status labels with `Preparing camera`, `Position yourself`, `Ready`, `Tracking lost`, and actionable error/retry states. Start is available only after setup posture and valid frames pass readiness.

Acceptance: synthetic/invalid points never count; camera errors become visible; active never appears before a valid pose stream; a lost/reappearing pose cannot complete a partial rep.

### Phase 2 — correct session state and rep contract

5. Introduce one explicit session phase model: permission/setup, ready, running, paused, rest, completed, failed, exiting. Derive visible buttons and engine acceptance from the same phase.
6. Make set/rest counters derive from one authoritative session tally, not independent state updates. Remove Resume while a set-rest transition is pending; guard rapid taps and duplicate completion.
7. Write an exercise contract for each movement with a qualified professional: start pose, tracked side(s), required range, completion point, hold duration, allowed support, excluded conditions and camera view. Then align detector, UI, voice and demo to that contract.
8. Decide per exercise whether reps are unilateral, alternating or bilateral. Replace generic session cooldown assumptions only after annotated examples show the intended behavior. Make partial repetitions either clearly uncounted with helpful feedback or separately visible; never silently mislabel.
9. Compare a simple hysteresis finite-state machine (current baseline) with smoothing such as One Euro/EMA only on recorded test streams. Filter cautiously: excessive smoothing adds latency and can erase short movement. Keep thresholds and filters configurable per movement.

Acceptance: frame-sequence tests cover every valid/invalid transition, start mid-motion, partial reps, jitter, slow reps, pauses, gaps, re-entry, one/both sides, set rest and end. UI, speech and counted state agree.

### Phase 3 — validation dataset and device path

10. Build a consented, privacy-protective set of short recordings for each exercise, with ground-truth frame/rep labels. Include different ages, body sizes, clothing, mobility ranges, chair types, lighting, camera angles/distance, occlusion, phone/laptop performance, and intended use of support. Keep data local/access-controlled and retention explicit.
11. Have at least two independent reviewers annotate reps and disagreement; resolve definitions before tuning. Split participants (not frames from the same person) into tuning and held-out evaluation groups to avoid leakage.
12. Report precision/false counts, missed reps, partial-rep handling, timing error, invalid-pose detection, time-to-ready and inference latency separately by exercise, device and difficult condition. Define a conservative acceptance threshold with a human exercise professional; do not copy numbers from papers or GitHub READMEs.
13. Replay the same labeled clips through native and browser adapters. Add regression clips for every discovered failure, with no identifiable video committed unless consent and licensing permit; otherwise preserve derived landmark traces.
14. Test Android standalone/dev builds, browser secure contexts and target low-end laptop. Make an explicit product decision for iOS: implement a supported native adapter (evaluate Apple Vision/ML Kit alternatives and landmark parity) or clearly label it unsupported. Expo Go alone is not sufficient for custom native module validation.

Acceptance: a repeatable test protocol and held-out per-exercise/device report; supported platform matrix; no accuracy claims beyond the measured population and setup.

### Phase 4 — results, local data, accessibility

15. Rename/remove the current “consistency” percentage if users could read it as form quality. Show only measured values with plain explanations and “not enough data” where appropriate. Don’t create an overall score before validation.
16. Test AsyncStorage/session status paths: successful save, failed save, app restart, corrupt record, concurrent writes, history load, delete, retry and browser persistence. Show save outcome accurately and ensure privacy text matches actual storage/network behavior.
17. Complete the exercise path in Kannada/English, including setup prompts, tracking states, failures, results and voice language. A missing voice engine must fall back silently/clearly without blocking reps.
18. Review camera framing guidance, large text, touch targets, keyboard/screen reader, contrast and simplified recovery with older users. Position the phone/laptop directions per movement and avoid implying the app diagnoses safety.
19. Exercise demo QA: ensure each ID maps to the correct video, no unknown ID silently falls back to a different exercise, native/web playback controls work, and offline behavior is clear.
20. Treat Family and notification actions as unavailable features; either keep honest disabled/coming-soon states or implement them in a separately scoped task.

## Existing examples worth borrowing carefully

| Pattern | Source | OSMIUM application |
|---|---|---|
| Hysteresis FSM, confidence gating, smoothing, distance normalization, per-rep data | [IO_motion](https://github.com/bardia1122/IO_motion) | Evaluate against current engine on held-out clips; adopt only measured improvements. |
| Explicit `ok` / `no_pose` / `uncalibrated` / `error`; full vs partial reps | [squat-counter](https://github.com/dimsedra/squat-counter) | Use a consistent internal tracker/session result model and honest UI states. |
| Cross-platform OS-native landmark adapters | [Nitro pose exercises](https://github.com/Gautham495/react-native-nitro-pose-exercises) | Compare as a future iOS path, including Expo integration, performance, licensing and joint parity. |
| Multiple viewpoints and concurrent activity evaluation | [viewpoint study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10692053/) | Add view angle and bystander cases to NOVEN’s own test protocol. |
| Sequential periodicity methods for rep counting | [Scientific Reports study](https://www.nature.com/articles/s41598-025-25674-1.pdf) | Benchmark later if threshold FSM is insufficient; protect real-time and interpretability needs. |
| Error states and confidence semantics | [MediaPipe docs](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker) | Do not synthesize points; preserve real confidence and propagate task errors. |

These are implementation examples and research references, not endorsements or proof of clinical suitability. Check repository licenses and current maintenance before copying code.

## Next verification and repair order

1. Install a fresh Android development build when device testing is authorized. Expo Go cannot validate the custom native pose tracker. Check permission prompt, preview, first camera frame, first pose frame, 3-second hold, early release, and all three exercises.
2. Capture the `PoseTracker` log tag only if a device run fails. Use the startup timeout category and CameraX state to distinguish permission, preview binding, model initialization, and inference failure.
3. Resolve the 19 remaining UI/branding source-assertion failures separately from camera behavior. Do not relax behavior tests for rep counting or error handling.
4. Add Android hardware-back handling and verify camera release and save behavior on every navigation path.
5. Finish Phase 3 measurement with consented clips and independent annotations before changing movement thresholds or claiming form accuracy. Then address iOS support and the network-dependent browser/WebView model path.

For each issue, record files changed, expected behavior, tests, device(s) checked and unresolved limitations. Keep changes small enough to review and preserve user data. Yoga and meditation remain out of scope.
