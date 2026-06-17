// §A0 — keep the frontend Coming-Soon mirror in sync with the backend authority
// (vettit-backend/src/config/comingSoon.js → COMING_SOON_GOAL_TYPES). The backend
// ENFORCES the gate (rejects mission-create + Stripe checkout for these types);
// this asserts the frontend UX mirror lists exactly the same set, so the two
// never visibly diverge.
//
// NOTE: the frontend has no configured test runner yet (no vitest/jest dep). Wire
// vitest to actually execute this (and src/lib/__tests__/initials.test.ts). Until
// then it documents the invariant; the runnable guard is the backend test
// (vettit-backend/test/coming_soon_gate.test.js).
import { MISSION_GOALS } from '../missionGoals';

// Mirror of the backend COMING_SOON_GOAL_TYPES. Update BOTH sides when un-gating
// a type (after it passes live e2e — never on fixture data).
const BACKEND_COMING_SOON = ['audience_profiling', 'creative_attention', 'market_entry'];

describe('Coming-Soon frontend↔backend sync', () => {
  it('frontend comingSoon flags match the backend gated set exactly', () => {
    const frontend = MISSION_GOALS.filter((g) => g.comingSoon).map((g) => g.id).sort();
    expect(frontend).toEqual([...BACKEND_COMING_SOON].sort());
  });
});
