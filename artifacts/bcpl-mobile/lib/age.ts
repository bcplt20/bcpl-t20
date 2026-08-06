// Compute a whole-year age from a YYYY-MM-DD date-of-birth string.
// Returns null when the string is missing or not a valid calendar date.
export function computeAge(dob?: string | null): number | null {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [y, m, d] = dob.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  // Reject values that JS "rolled over" (e.g. 2000-13-40).
  if (birth.getFullYear() !== y || birth.getMonth() !== m - 1 || birth.getDate() !== d) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const hadBirthday = now.getMonth() > m - 1 || (now.getMonth() === m - 1 && now.getDate() >= d);
  if (!hadBirthday) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}
