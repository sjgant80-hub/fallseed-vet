// seed.mjs — refuse to fork a seed that is not a seed.
//
// ⚑ A SEED IS A THING THAT MAKES OTHER THINGS. `downloadForkedSeed` took whatever was typed into the
// editor and wrote it straight into a new file: a prime of 4, no roles, tool primes outside the
// window, two tools claiming the same prime — all of it forked happily, and the result looked exactly
// as legitimate as a real seed. Nothing anywhere validated a manifest. An unchecked fork does not
// stay one broken seed; it becomes the parent of every seed forked from IT.
//
// ⚑ THE RULES ARE READ OFF THE FLEET, NOT INVENTED. Every check below is something the sixteen
// existing seeds already satisfy — audited before a line of this was written. Inventing a stricter
// rule would have condemned real seeds as invalid, which is the same class of error as a verifier
// that calls a real audit trail forged.
//
// Pure: no I/O, no clock, no network.

/** Trial division. These numbers are small and this is the only definition of "prime" here. */
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

/** The four roles a bundle seed ships. A seed may declare fewer; it may not invent others. */
export const ROLES = ['anchor', 'onboard', 'paper', 'practice'];

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const arr = (v) => (Array.isArray(v) ? v : []);

/**
 * Check one manifest. Returns every problem found, not just the first — somebody fixing a seed wants
 * the whole list, and stopping at the first turns one round trip into five.
 *
 * Each problem is a sentence naming what is wrong and what would fix it.
 */
export function validateManifest(manifest) {
  const m = (manifest && typeof manifest === 'object') ? manifest : {};
  const problems = [];

  if (!str(m.name)) problems.push('the seed has no name — a fork needs one to be filed under');

  if (!isPrime(m.prime)) {
    problems.push(`prime ${JSON.stringify(m.prime)} is not a prime number — every seed is identified by one`);
  }

  const win = arr(m.primeWindow);
  const notPrime = win.filter(p => !isPrime(p));
  if (notPrime.length) problems.push(`the prime window contains numbers that are not prime: ${notPrime.join(', ')}`);
  const dupWin = win.filter((p, i) => win.indexOf(p) !== i);
  if (dupWin.length) problems.push(`the prime window repeats: ${[...new Set(dupWin)].join(', ')}`);

  const roles = arr(m.bundleRoles).map(str).filter(Boolean);
  const strange = roles.filter(r => !ROLES.includes(r));
  if (strange.length) problems.push(`unknown role${strange.length > 1 ? 's' : ''}: ${strange.join(', ')} — the roles are ${ROLES.join(', ')}`);

  if (m.level != null && !(Number.isInteger(m.level) && m.level >= 0)) {
    problems.push(`level ${JSON.stringify(m.level)} is not a whole number of zero or more`);
  }
  if (m.parent != null && typeof m.parent !== 'string') {
    problems.push('parent must be the name of the seed this was forked from, or nothing at all');
  }

  return { ok: problems.length === 0, problems };
}

/**
 * Check the tools a seed carries, against its own manifest.
 *
 * ⚑ A TOOL WHOSE PRIME IS OUTSIDE THE WINDOW IS THE ONE THAT MATTERS. The window is how a seed says
 * which primes belong to it; a tool outside it is claiming a number that belongs to another seed, and
 * nothing before this noticed.
 */
export function validateTools(manifest, tools) {
  const m = (manifest && typeof manifest === 'object') ? manifest : {};
  const win = arr(m.primeWindow);
  const roles = arr(m.bundleRoles).map(str).filter(Boolean);
  const list = arr(tools);
  const problems = [];
  const seen = new Map();

  for (const t of list) {
    const tool = (t && typeof t === 'object') ? t : {};
    const name = str(tool.name) || '(unnamed tool)';

    if (!isPrime(tool.prime)) {
      problems.push(`${name}: prime ${JSON.stringify(tool.prime)} is not a prime number`);
    } else {
      if (win.length && !win.includes(tool.prime)) {
        problems.push(`${name}: prime ${tool.prime} is outside this seed's window [${win.join(', ')}] — it belongs to another seed`);
      }
      if (seen.has(tool.prime)) problems.push(`${name}: prime ${tool.prime} is already used by ${seen.get(tool.prime)}`);
      else seen.set(tool.prime, name);
    }

    const role = str(tool.role);
    if (!role) problems.push(`${name}: no role — one of ${ROLES.join(', ')}`);
    else if (!ROLES.includes(role)) problems.push(`${name}: unknown role "${role}"`);
    else if (roles.length && !roles.includes(role)) {
      problems.push(`${name}: role "${role}" is not one this seed declares (${roles.join(', ')})`);
    }

    const url = str(tool.url);
    if (!url) problems.push(`${name}: no address — a tool nobody can open is not a tool`);
    else if (!/^https:\/\//.test(url)) problems.push(`${name}: address must start with https://`);
  }

  const roleCount = list.map(t => str(t && t.role)).filter(Boolean);
  const dupRole = roleCount.filter((r, i) => roleCount.indexOf(r) !== i);
  if (dupRole.length) problems.push(`two tools claim the same role: ${[...new Set(dupRole)].join(', ')}`);

  return { ok: problems.length === 0, problems };
}

/** Everything, in one call — what a fork should be asked before it is allowed to happen. */
export function validateSeed(seed) {
  const s = (seed && typeof seed === 'object') ? seed : {};
  const a = validateManifest(s.manifest);
  const b = validateTools(s.manifest, s.baseTools);
  const problems = [...a.problems, ...b.problems];
  return { ok: problems.length === 0, problems };
}

/**
 * Across a fleet: no two seeds may claim the same prime.
 *
 * A single seed cannot see this, which is exactly why it is a separate function and not a rule inside
 * validateSeed — a check that quietly needs information it was not given is worse than no check.
 */
export function primeCollisions(seeds) {
  const byPrime = new Map();
  for (const s of arr(seeds)) {
    const m = (s && typeof s === 'object' && s.manifest && typeof s.manifest === 'object') ? s.manifest : {};
    if (!isPrime(m.prime)) continue;
    if (!byPrime.has(m.prime)) byPrime.set(m.prime, []);
    byPrime.get(m.prime).push(str(m.name) || '(unnamed)');
  }
  const clashes = [];
  for (const [prime, names] of byPrime) if (names.length > 1) clashes.push({ prime, names: names.sort() });
  return clashes.sort((a, b) => a.prime - b.prime);
}

/**
 * Find the SEED_DEFAULT object in a page, honestly.
 *
 * ⚑ THE ORIGINAL COUNTED BRACES WITHOUT LOOKING AT STRINGS. One brace inside a regulatory answer —
 * and these seeds are full of quoted legal text — ended the object early, so the fork wrote a
 * truncated seed and a broken file. This walks strings, template literals, comments and escapes, and
 * returns null rather than a guess when it cannot find a clean end.
 */
export function findSeedLiteral(source, marker) {
  const src = String(source == null ? '' : source);
  const open = String(marker || 'const SEED_DEFAULT = {');
  const start = src.indexOf(open);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;

  let depth = 0, inS = null, esc = false, line = false, block = false;
  for (; i < src.length; i++) {
    const c = src[i], next = src[i + 1];
    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && next === '/') { block = false; i++; } continue; }
    if (inS) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === inS) inS = null;
      continue;
    }
    if (c === '/' && next === '/') { line = true; i++; continue; }
    if (c === '/' && next === '*') { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { start, end: i + 1 }; }
  }
  return null;   // never a guess
}

export default { isPrime, ROLES, validateManifest, validateTools, validateSeed, primeCollisions, findSeedLiteral };
