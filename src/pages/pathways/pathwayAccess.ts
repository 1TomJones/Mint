import { AccessLevel } from '../../data/pathwaysData';
import { MockPlan } from '../../context/AuthMockContext';

export function canAccessPathway(isLoggedIn: boolean, plan: MockPlan, accessLevel: AccessLevel) {
  if (!isLoggedIn) {
    return false;
  }

  if (accessLevel === 'free') {
    return true;
  }

  return plan === 'pro';
}
