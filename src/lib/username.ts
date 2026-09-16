// Kullanıcı adı kuralları. Kayıt formundaki HTML `pattern` ile sunucu
// doğrulaması aynı kaynaktan beslenir.
//
// "@" bilerek izinli değil: giriş alanı "@" içeriyorsa e-posta, içermiyorsa
// kullanıcı adı olarak yorumlanır. Yalnızca ASCII harf: Türkçe harflerde
// (İ/ı) büyük/küçük harf eşlemesi veritabanı collation'ına göre değişir ve
// lower() tabanlı benzersizlik güvenilmez olurdu.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

export const USERNAME_PATTERN = `[A-Za-z0-9_.]{${USERNAME_MIN},${USERNAME_MAX}}`;

export const USERNAME_HINT = `${USERNAME_MIN}–${USERNAME_MAX} karakter; harf, rakam, _ ve . kullanılabilir.`;

const USERNAME_RE = new RegExp(`^${USERNAME_PATTERN}$`);

export function isValidUsername(value: string) {
  return USERNAME_RE.test(value);
}
