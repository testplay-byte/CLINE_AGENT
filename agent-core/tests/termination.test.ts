import { describe, expect, it } from 'vitest';
import {
  advance,
  allOf,
  composite,
  maxTurns,
  stopOnText,
  type RunState,
} from '../src/orchestration/run-loop.js';

describe('termination algebra', () => {
  it('maxTurns fires exactly at the budget', () => {
    const condition = maxTurns(3);
    expect(condition({ turn: 2 }).stop).toBe(false);
    expect(condition({ turn: 3 })).toEqual({ stop: true, reason: 'max_turns(3)' });
  });

  it('stopOnText fires only when the sentinel appears', () => {
    const condition = stopOnText('TASK_COMPLETE');
    expect(condition({ turn: 0, lastText: 'working...' }).stop).toBe(false);
    expect(condition({ turn: 0, lastText: 'all done TASK_COMPLETE' }).stop).toBe(true);
    expect(condition({ turn: 5 }).stop).toBe(false);
  });

  it('composite stops when ANY condition fires (OR)', () => {
    const condition = composite(maxTurns(10), stopOnText('DONE'));
    expect(condition({ turn: 1, lastText: 'nothing yet' }).stop).toBe(false);
    const byText = condition({ turn: 1, lastText: 'DONE' });
    expect(byText.stop).toBe(true);
    expect(byText.reason).toContain('stop_on_text');
    expect(condition({ turn: 10, lastText: '' }).reason).toBe('max_turns(10)');
  });

  it('allOf stops only when EVERY condition fires (AND)', () => {
    const condition = allOf(maxTurns(3), stopOnText('DONE'));
    expect(condition({ turn: 3, lastText: 'still going' }).stop).toBe(false);
    expect(condition({ turn: 2, lastText: 'DONE' }).stop).toBe(false);
    expect(condition({ turn: 3, lastText: 'DONE' }).stop).toBe(true);
  });
});

describe('run state reducer', () => {
  it('walks the happy path idle -> assembling -> running -> done', () => {
    let state: RunState = 'idle';
    state = advance(state, { type: 'start' });
    expect(state).toBe('assembling');
    state = advance(state, { type: 'assembled' });
    expect(state).toBe('running');
    state = advance(state, { type: 'turn' });
    expect(state).toBe('running');
    state = advance(state, { type: 'complete' });
    expect(state).toBe('done');
  });

  it('routes approval interrupts without blocking the loop', () => {
    let state: RunState = advance('running', { type: 'approval_requested' });
    expect(state).toBe('awaiting_approval');
    state = advance(state, { type: 'approval_decided', decision: 'approved' });
    expect(state).toBe('running');
    state = advance(state, { type: 'approval_requested' });
    state = advance(state, { type: 'approval_decided', decision: 'rejected' });
    expect(state).toBe('done'); // denial aborts the task cleanly
  });

  it('supports pause/resume and fails from anywhere', () => {
    expect(advance(advance('running', { type: 'pause' }), { type: 'resume' })).toBe('running');
    expect(advance('idle', { type: 'fail' })).toBe('failed');
    expect(advance('done', { type: 'fail' })).toBe('failed');
  });

  it('ignores events that make no sense for the current state', () => {
    expect(advance('idle', { type: 'complete' })).toBe('idle');
    expect(advance('paused', { type: 'start' })).toBe('paused');
  });
});