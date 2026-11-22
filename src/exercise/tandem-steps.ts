import type { LandmarkEventPayload } from '../../modules/pose-tracker';
import { isTrustedLandmark } from './landmark-trust';

// Compare heel positions in foot lengths so framing and walking direction can vary.
export class TandemSteps {
  private baseline: [number, number] | null = null;
  private direction = 0;
  private lastLead: number | null = null;
  private unscoredLanding: { lead: number; heels: [number, number] } | null = null;
  private candidate: number | null = null;
  private lastTime: number | null = null;

  reset() {
    this.baseline = null;
    this.unscoredLanding = null;
    this.lastLead = null;
    this.candidate = null;
    this.lastTime = null;
  }

  process(points: LandmarkEventPayload[], time: number, aspect: number, visibility: number, maxGap: number) {
    if (this.lastTime !== null && time <= this.lastTime) return false;
    if (this.lastTime !== null && time - this.lastTime > maxGap) this.reset();
    this.lastTime = time;
    const find = (name: LandmarkEventPayload['name']) => points.find(p => p.name === name);
    const lh = find('LEFT_HEEL'), lt = find('LEFT_FOOT_INDEX');
    const rh = find('RIGHT_HEEL'), rt = find('RIGHT_FOOT_INDEX');
    if (!isTrustedLandmark(lh, visibility) || !isTrustedLandmark(lt, visibility) ||
        !isTrustedLandmark(rh, visibility) || !isTrustedLandmark(rt, visibility)) {
      this.reset();
      return false;
    }
    const leftSpan = lt.x - lh.x, rightSpan = rt.x - rh.x;
    const direction = Math.sign(leftSpan);
    const length = (Math.abs(leftSpan) + Math.abs(rightSpan)) / 2;
    const heels: [number, number] = [lh.x, rh.x];
    if (direction !== Math.sign(rightSpan) || Math.min(Math.abs(leftSpan), Math.abs(rightSpan)) < 0.012) {
      this.candidate = null;
      return false;
    }
    const lead = (lh.x - rh.x) * direction >= 0 ? 0 : 1;
    const heel = lead === 0 ? lh : rh, toe = lead === 0 ? rt : lt;
    const gap = (heel.x - toe.x) * direction / length;
    const level = Math.abs(heel.y - toe.y) <= length * aspect * 0.4;
    const placed = level && gap >= -0.35 && gap <= 0.5;
    if (!this.baseline || this.direction !== direction) {
      this.candidate = null;
      this.unscoredLanding = null;
      this.direction = direction;
      this.baseline = heels;
      this.lastLead = placed ? lead : null;
      return false;
    }
    if (this.unscoredLanding && lead !== this.unscoredLanding.lead) {
      this.baseline = this.unscoredLanding.heels;
      this.lastLead = this.unscoredLanding.lead;
      this.unscoredLanding = null;
    }
    const trailMoved = Math.abs(heels[1 - lead] - this.baseline[1 - lead]) > length * 0.55;
    const advanced = (heels[lead] - this.baseline[lead]) * direction >= length * 0.5;
    const newStep = lead !== this.lastLead && advanced && !trailMoved;
    if (!level || (!newStep && !(placed && trailMoved))) {
      this.candidate = null;
      return false;
    }
    if (this.candidate !== lead) {
      this.candidate = lead;
      return false;
    }
    if (!placed) {
      // Retain the landing as the trailing-foot reference when the lead switches.
      // The same foot can still advance into a valid placement before then.
      this.unscoredLanding = { lead, heels };
      return false;
    }
    this.unscoredLanding = null;
    this.baseline = heels;
    this.lastLead = lead;
    this.candidate = null;
    return newStep;
  }
}
