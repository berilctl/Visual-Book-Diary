// Username rules, shared by the HTML `pattern` on the sign-up form and the
// server-side validation.
//
// "@" is deliberately not allowed: an identifier containing "@" is treated as
// an email address, anything else as a username. Letters are ASCII only —
// case mapping for Turkish letters (İ/ı) depends on the database collation,
// which would make lower()-based uniqueness unreliable.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export const USERNAME_PATTERN = `[A-Za-z0-9_.]{${USERNAME_MIN},${USERNAME_MAX}}`;

// The rule text shown to the user lives in the dictionary:
// t.auth.usernameHint(USERNAME_MIN, USERNAME_MAX).

const USERNAME_RE = new RegExp(`^${USERNAME_PATTERN}$`);

export function isValidUsername(value: string) {
  return USERNAME_RE.test(value);
}
