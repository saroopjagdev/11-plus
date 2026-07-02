// Exact rational arithmetic. Fractions are the single biggest source of the old
// bank's wrong answers, so every fraction is handled as an exact {n, d} pair —
// never a floating-point number — and simplified via gcd.

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function makeFraction(n, d) {
  if (d === 0) throw new Error('Zero denominator');
  // Keep the sign on the numerator.
  if (d < 0) {
    n = -n;
    d = -d;
  }
  return { n, d };
}

function simplify(fr) {
  const g = gcd(fr.n, fr.d);
  return makeFraction(fr.n / g, fr.d / g);
}

function add(a, b) {
  return simplify(makeFraction(a.n * b.d + b.n * a.d, a.d * b.d));
}

function subtract(a, b) {
  return simplify(makeFraction(a.n * b.d - b.n * a.d, a.d * b.d));
}

function multiply(a, b) {
  return simplify(makeFraction(a.n * b.n, a.d * b.d));
}

// True when two fractions are the same value (cross-multiplication).
function equals(a, b) {
  return a.n * b.d === b.n * a.d;
}

function isSimplified(fr) {
  return gcd(fr.n, fr.d) === 1;
}

function toText(fr) {
  if (fr.d === 1) return String(fr.n);
  return `${fr.n}/${fr.d}`;
}

module.exports = {
  gcd,
  makeFraction,
  simplify,
  add,
  subtract,
  multiply,
  equals,
  isSimplified,
  toText,
};
