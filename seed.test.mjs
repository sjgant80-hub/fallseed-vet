// seed.test.mjs — PROOF-OF-PLAY for the check that stops a broken seed becoming a parent.
import { isPrime, ROLES, validateManifest, validateTools, validateSeed, primeCollisions, findSeedLiteral } from './seed.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); };

// The real clinic seed, as shipped. Everything below is measured against a seed that exists.
const REAL = {
  manifest: {
    name: 'clinic-firm', prime: 1153, level: 0, parent: 'fallseed-hr',
    primeWindow: [919, 929, 937, 941], bundleRoles: ['anchor', 'onboard', 'paper', 'practice'],
  },
  baseTools: [
    { role: 'anchor', name: 'fallclinic', prime: 919, url: 'https://sjgant80-hub.github.io/fallclinic/' },
    { role: 'onboard', name: 'fallcliniconboard', prime: 929, url: 'https://sjgant80-hub.github.io/fallcliniconboard/' },
    { role: 'paper', name: 'fallclinicpaper', prime: 937, url: 'https://sjgant80-hub.github.io/fallclinicpaper/' },
    { role: 'practice', name: 'fallclinicpractice', prime: 941, url: 'https://sjgant80-hub.github.io/fallclinicpractice/' },
  ],
};
const clone = () => JSON.parse(JSON.stringify(REAL));

console.log('\n=== §1 · ⚑ THE SEEDS THAT ALREADY EXIST MUST PASS ===');
{
  const v = validateSeed(REAL);
  ok(v.ok === true, '⚑ a real shipped seed validates — a rule that condemns real work is the wrong rule');
  ok(v.problems.length === 0, 'with nothing to report');

  // Seeds that carry no bundle at all — the higher-tier ones — are also real.
  ok(validateSeed({ manifest: { name: 'agents', prime: 1223, level: 3, primeWindow: [1223], bundleRoles: [] }, baseTools: [] }).ok === true,
     'and so does a tier seed with no tools of its own');
  ok(validateSeed({ manifest: { name: 'meta', prime: 1279 } }).ok === true,
     'and one with no window, no level and no parent');
}

console.log('\n=== §2 · primes are primes ===');
{
  ok(isPrime(2) && isPrime(3) && isPrime(1153) && isPrime(1279), 'known primes are prime');
  ok(!isPrime(1) && !isPrime(0) && !isPrime(4) && !isPrime(1000), 'known composites are not');
  ok(!isPrime(-7) && !isPrime(2.5) && !isPrime(NaN), 'negatives, fractions and NaN are not');
  ok(!isPrime('1153') && !isPrime(null) && !isPrime(undefined), '⚑ and neither is the STRING "1153" — a prime read from a form field is text');
  ok(isPrime(9) === false, '9 is not prime, so the odd-divisor loop really runs');
  ok(isPrime(25) === false && isPrime(49) === false, 'nor are squares of odd primes');
}

console.log('\n=== §3 · ⚑ WHAT A FORK MUST BE REFUSED FOR ===');
{
  const nameless = clone(); nameless.manifest.name = '   ';
  ok(!validateSeed(nameless).ok, 'a seed with a blank name is refused');

  const four = clone(); four.manifest.prime = 4;
  const v4 = validateSeed(four);
  ok(!v4.ok && /not a prime/.test(v4.problems[0]), '⚑ a prime of 4 is refused, and told why');

  const outside = clone(); outside.baseTools[2].prime = 1009;   // belongs to fallseed-hr
  const vo = validateSeed(outside);
  ok(!vo.ok && /outside this seed/.test(vo.problems.join(' ')),
     "⚑ a tool claiming a prime from ANOTHER seed's window is caught — this is the one that matters");

  const dup = clone(); dup.baseTools[1].prime = 919;
  ok(/already used by/.test(validateSeed(dup).problems.join(' ')), 'two tools claiming one prime is caught');

  const dupRole = clone(); dupRole.baseTools[1].role = 'anchor';
  ok(/same role/.test(validateSeed(dupRole).problems.join(' ')), 'two tools claiming one role is caught');

  const madeUp = clone(); madeUp.baseTools[0].role = 'wizard';
  ok(/unknown role/.test(validateSeed(madeUp).problems.join(' ')), 'an invented role is caught');

  const notDeclared = clone(); notDeclared.manifest.bundleRoles = ['anchor'];
  ok(/does not declare|is not one this seed declares/.test(validateSeed(notDeclared).problems.join(' ')),
     'a tool in a role the seed never declared is caught');

  const noUrl = clone(); noUrl.baseTools[0].url = '';
  ok(/nobody can open/.test(validateSeed(noUrl).problems.join(' ')), 'a tool with no address is caught');

  const httpOnly = clone(); httpOnly.baseTools[0].url = 'http://example.com/';
  ok(/https/.test(validateSeed(httpOnly).problems.join(' ')), 'and a plain http address is refused');

  const badWin = clone(); badWin.manifest.primeWindow = [919, 920, 937, 941];
  ok(/not prime/.test(validateSeed(badWin).problems.join(' ')), 'a non-prime in the window is caught');

  const dupeWin = clone(); dupeWin.manifest.primeWindow = [919, 919, 937, 941];
  ok(/repeats/.test(validateSeed(dupeWin).problems.join(' ')), 'a repeated number in the window is caught');

  const badLevel = clone(); badLevel.manifest.level = -1;
  ok(/whole number/.test(validateSeed(badLevel).problems.join(' ')), 'a negative level is caught');
  const fracLevel = clone(); fracLevel.manifest.level = 1.5;
  ok(/whole number/.test(validateSeed(fracLevel).problems.join(' ')), 'and a fractional one');
  const badParent = clone(); badParent.manifest.parent = 42;
  ok(/parent must be/.test(validateSeed(badParent).problems.join(' ')), 'a parent that is not a name is caught');
}

console.log('\n=== §4 · ⚑ EVERY PROBLEM, NOT JUST THE FIRST ===');
{
  const wrecked = clone();
  wrecked.manifest.name = ''; wrecked.manifest.prime = 4;
  wrecked.baseTools[0].url = ''; wrecked.baseTools[1].prime = 6;
  const v = validateSeed(wrecked);
  ok(v.problems.length >= 4, '⚑ four faults produce four problems — stopping at the first makes five round trips out of one');
  ok(v.problems.every(p => typeof p === 'string' && p.length > 20), 'and each one is a sentence somebody can act on');
}

console.log('\n=== §5 · a fleet cannot share a prime ===');
{
  const fleet = [
    { manifest: { name: 'clinic', prime: 1153 } },
    { manifest: { name: 'law', prime: 1033 } },
    { manifest: { name: 'vet', prime: 1171 } },
  ];
  ok(primeCollisions(fleet).length === 0, 'the real fleet has no collisions');
  const clash = [...fleet, { manifest: { name: 'copycat', prime: 1153 } }];
  const c = primeCollisions(clash);
  ok(c.length === 1 && c[0].prime === 1153, 'a duplicate prime across seeds is found');
  ok(c[0].names.join(',') === 'clinic,copycat', 'and BOTH claimants are named — one of them is not automatically the wrong one');
  ok(primeCollisions([{ manifest: { prime: 4 } }, { manifest: { prime: 4 } }]).length === 0,
     'numbers that are not prime are not collisions — they are already refused elsewhere');
  ok(primeCollisions(null).length === 0 && primeCollisions([null]).length === 0, 'garbage collides with nothing');
}

console.log('\n=== §6 · ⚑ FINDING THE SEED IN THE PAGE, WITH STRINGS RESPECTED ===');
{
  const page = `x\nconst SEED_DEFAULT = {\n a: 1,\n b: 'a brace } inside a quote',\n c: 2\n};\nmore`;
  const f = findSeedLiteral(page);
  ok(f !== null, 'it finds the object');
  ok(page.slice(f.start, f.end).endsWith('}'), 'and ends on the closing brace');
  ok(page.slice(f.start, f.end).includes('c: 2'),
     '⚑ a brace inside a QUOTED STRING does not end it early — these seeds are full of quoted legal text');

  const tmpl = 'const SEED_DEFAULT = {\n a: `a } in a template`,\n z: 9\n};';
  ok(findSeedLiteral(tmpl) && tmpl.slice(0, findSeedLiteral(tmpl).end).includes('z: 9'), 'template literals too');

  const comment = 'const SEED_DEFAULT = {\n // a } in a comment\n z: 9\n};';
  ok(findSeedLiteral(comment) && comment.slice(0, findSeedLiteral(comment).end).includes('z: 9'), 'line comments too');

  const blockC = 'const SEED_DEFAULT = {\n /* a } in a block */\n z: 9\n};';
  ok(findSeedLiteral(blockC) && blockC.slice(0, findSeedLiteral(blockC).end).includes('z: 9'), 'block comments too');

  const escaped = "const SEED_DEFAULT = {\n a: 'it\\'s got } and a quote',\n z: 9\n};";
  ok(findSeedLiteral(escaped) && escaped.slice(0, findSeedLiteral(escaped).end).includes('z: 9'), 'and an escaped quote does not end the string');

  ok(findSeedLiteral('nothing here') === null, 'a page with no seed returns null');
  ok(findSeedLiteral('const SEED_DEFAULT = {\n unclosed: 1') === null,
     '⚑ an object that never closes returns NULL rather than a guess — a guess would write a truncated seed');
  ok(findSeedLiteral(null) === null && findSeedLiteral(undefined) === null, 'garbage finds nothing');
}

console.log('\n=== §8 · the two halves report their own verdict ===');
{
  // validateSeed passes through validateManifest and validateTools, so its verdict alone can hide an
  // inverted one underneath it.
  ok(validateManifest(REAL.manifest).ok === true, 'a good manifest reports ok');
  ok(validateManifest({ name: 'x', prime: 4 }).ok === false, 'and a bad one reports not-ok');
  ok(validateTools(REAL.manifest, REAL.baseTools).ok === true, 'good tools report ok');
  ok(validateTools(REAL.manifest, [{ role: 'anchor', name: 'x', prime: 4, url: 'https://a/' }]).ok === false,
     'and bad tools report not-ok');
}

console.log('\n=== §9 · it says exactly what is wrong ===');
{
  // The singular/plural is on the MANIFEST's declared roles, not on a tool's role.
  const one = clone(); one.manifest.bundleRoles = ['anchor', 'onboard', 'paper', 'practice', 'wizard'];
  ok(/unknown role: wizard/.test(validateManifest(one.manifest).problems.join(' ')), 'one strange role reads singular');
  const two = clone(); two.manifest.bundleRoles = ['anchor', 'wizard', 'goblin'];
  ok(/unknown roles: wizard, goblin/.test(validateSeed(two).problems.join(' ')),
     '⚑ two strange roles read PLURAL — a message that says "role" for three of them reads like one fault');

  const noName = validateTools(REAL.manifest, [{ role: 'anchor', prime: 919, url: 'https://a/' }]);
  ok(noName.ok === true, 'a tool with no name is otherwise fine');
  const bad = validateTools(REAL.manifest, [{ role: 'anchor', prime: 4, url: 'https://a/' }]);
  ok(/\(unnamed tool\)/.test(bad.problems.join(' ')),
     '⚑ and when a nameless tool IS wrong it is called "(unnamed tool)", not left blank');
}

console.log('\n=== §10 · the literal walker, pushed harder ===');
{
  // A URL inside the seed: full of slashes, and these seeds are made of them.
  const urls = "const SEED_DEFAULT = {\n u: 'https://sjgant80-hub.github.io/fallclinic/',\n z: 9\n};";
  const f1 = findSeedLiteral(urls);
  ok(f1 && urls.slice(f1.start, f1.end).includes('z: 9'),
     '⚑ a URL is not a comment — slashes inside a string must not start one');

  const starInBlock = 'const SEED_DEFAULT = {\n /* stars * and / slashes } inside */\n z: 9\n};';
  const f2 = findSeedLiteral(starInBlock);
  ok(f2 && starInBlock.slice(f2.start, f2.end).includes('z: 9'),
     '⚑ a lone star or slash does not end a block comment — only the pair does');

  const divide = 'const SEED_DEFAULT = {\n n: 10 / 2,\n z: 9\n};';
  const f3 = findSeedLiteral(divide);
  ok(f3 && divide.slice(f3.start, f3.end).includes('z: 9'), 'a division sign is not a comment');

  // ⚑ THE CLOSING BRACE ON THE SAME LINE AS A SLASH. If a single slash were treated as the start of
  // a line comment, everything after it — including the brace that ends the object — would be
  // skipped, and the walker would return null on a perfectly good seed. On the line above, the brace
  // sits on its own line, so the mistake stays invisible.
  const oneLine = 'const SEED_DEFAULT = { n: 10 / 2, z: 9 };';
  const f3b = findSeedLiteral(oneLine);
  ok(f3b !== null && oneLine.slice(f3b.start, f3b.end).endsWith('}'),
     '⚑ a lone slash does not swallow the rest of the line, brace included');

  // A custom marker that IS the brace, so the object starts at index 0.
  const bare = '{ a: 1 }';
  const f4 = findSeedLiteral(bare, '{');
  ok(f4 && f4.start === 0 && f4.end === bare.length,
     '⚑ an object at index 0 is found — position zero is a real position');
}

console.log('\n=== §7 · pure under garbage ===');
{
  const junk = [null, undefined, '', 0, [], {}, NaN, 'x', [null], { manifest: null }];
  let threw = null;
  for (const j of junk) {
    try { validateSeed(j); validateManifest(j); validateTools(j, j); primeCollisions(j); isPrime(j); findSeedLiteral(j); }
    catch (e) { threw = `${JSON.stringify(j)} → ${e.message}`; }
  }
  ok(threw === null, 'no input throws' + (threw ? ' — ' + threw : ''));
  ok(validateSeed(null).ok === false, 'and nothing at all is not a valid seed');
  ok(ROLES.length === 4, 'there are four roles');
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
