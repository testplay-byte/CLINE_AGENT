/**
 * Run-state reducer plus termination-condition algebra (AutoGen pattern).
 * Pure and synchronous: NO LLM calls happen here yet — this module is the
 * seam the real orchestrator will drive (ARCHITECTURE.md section 9).
 */

export type RunState =
  | 'idle'
  | 'assembling'
  | 'running'
  | 'awaiting_approval'
  | 'paused'
  | 'done'
  | 'failed';

export type RunEvent =
  | { type: 'start' }
  | { type: 'assembled' }
  | { type: 'turn' }
  | { type: 'approval_requested' }
  | { type: 'approval_decided'; decision: 'approved' | 'rejected' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'complete' }
  | { type: 'fail' };

/** Pure reducer; unknown events leave state untouched (graceful no-op). */
export function advance(state: RunState, event: RunEvent): RunState {
  switch (event.type) {
    case 'start':
      return state === 'idle' ? 'assembling' : state;
    case 'assembled':
      return state === 'assembling' ? 'running' : state;
    case 'turn':
      return state === 'running' || state === 'awaiting_approval' ? 'running' : state;
    case 'approval_requested':
      return state === 'running' ? 'awaiting_approval' : state;
    case 'approval_decided':
      if (state !== 'awaiting_approval') return state;
      return event.decision === 'approved' ? 'running' : 'done';
    case 'pause':
      return state === 'running' || state === 'awaiting_approval' ? 'paused' : state;
    case 'resume':
      return state === 'paused' ? 'running' : state;
    case 'complete':
      return state === 'running' || state === 'paused' ? 'done' : state;
    case 'fail':
      return 'failed';
    default:
      return state;
  }
}

export interface TerminationResult {
  stop: boolean;
  reason?: string;
}

export interface TerminationContext {
  turn: number;
  lastText?: string;
}

export type TerminationCondition = (context: TerminationContext) => TerminationResult;

/** Stop once the turn budget is exhausted (agents.max_turns). */
export function maxTurns(n: number): TerminationCondition {
  return (context) =>
    context.turn >= n ? { stop: true, reason: `max_turns(${n})` } : { stop: false };
}

/** Stop once the sentinel text appears in the latest message. */
export function stopOnText(text: string): TerminationCondition {
  return (context) =>
    typeof context.lastText === 'string' && context.lastText.includes(text)
      ? { stop: true, reason: `stop_on_text(${JSON.stringify(text)})` }
      : { stop: false };
}

/** OR-composition: any firing condition terminates the run. */
export function composite(...conditions: TerminationCondition[]): TerminationCondition {
  return (context) => {
    for (const condition of conditions) {
      const result = condition(context);
      if (result.stop) return result;
    }
    return { stop: false };
  };
}

/** AND-composition: every condition must fire before terminating. */
export function allOf(...conditions: TerminationCondition[]): TerminationCondition {
  return (context) => {
    for (const condition of conditions) {
      if (!condition(context).stop) return { stop: false };
    }
    return { stop: true, reason: conditions.map((c) => c(context).reason ?? 'unnamed').join(' AND ') };
  };
}