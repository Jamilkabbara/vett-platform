// Pass 27 I — initials utility unit test (logic only).
import { computeInitials } from '../initials';

describe('computeInitials', () => {
  it('returns "JK" for jk@example.com', () => {
    expect(computeInitials('jk@example.com')).toBe('JK');
  });
  it('returns "JA" for jamil.kabbara@example.com', () => {
    expect(computeInitials('jamil.kabbara@example.com')).toBe('JA');
  });
  it('returns "A" for a@b.co', () => {
    expect(computeInitials('a@b.co')).toBe('A');
  });
  it('returns "" for empty string', () => {
    expect(computeInitials('')).toBe('');
  });
  it('returns "" for null', () => {
    expect(computeInitials(null)).toBe('');
  });
});
