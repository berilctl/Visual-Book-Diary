// Türkçe arayüz metinleri — kaynak sözlük. en.ts bu dosyanın şeklini
// (Dictionary tipi) birebir karşılamak zorunda; eksik anahtar derleme hatasıdır.
//
// Sayıya ya da isme göre değişen metinler fonksiyon: dillerde söz dizimi ve
// çoğul kuralları farklı ("5 karakter" / "5 characters", "X düzenle" /
// "Edit X"), bu yüzden cümleler parça parça birleştirilmez.

export const tr = {
  meta: {
    description:
      "Okuduğun kitapların karakter, mekan ve alıntılarını görselleştir.",
  },

  common: {
    cancel: "İptal",
    save: "Kaydet",
    add: "Ekle",
    edit: "Düzenle",
    delete: "Sil",
    saving: "Kaydediliyor…",
    deleting: "Siliniyor…",
    logout: "Çıkış Yap",
    themeToggle: "Açık/koyu temayı değiştir",
  },

  locale: {
    label: "Dil",
    names: { tr: "Türkçe", en: "English" },
  },

  errors: {
    sessionMissing: "Oturum bulunamadı. Lütfen tekrar giriş yap.",
    bookIdMissing: "Kitap kimliği eksik.",
    cardIdMissing: "Kart kimliği eksik.",
    bookNotFound: "Kitap bulunamadı veya bu kitaba erişimin yok.",
    invalidKind: "Geçersiz tür.",
    invalidImageSource: "Geçersiz görsel kaynağı.",
    serviceUnavailable: "Şu an işlem yapılamıyor, lütfen tekrar dene.",
  },

  landing: {
    eyebrow: "Görsel okuma günlüğü",
    titleBefore: "Okuduğun kitapları ",
    titleHighlight: "görerek",
    titleAfter: " hatırla.",
    lead: "Karakterleri, mekanları ve altını çizdiğin cümleleri tek bir günlükte topla; her birini kendi seçtiğin görsellerle canlandır.",
    features: {
      characters: {
        title: "Karakterler",
        hint: "Kim kimdi? Yüzünü, kişiliğini ve etiketlerini sakla.",
      },
      locations: {
        title: "Mekanlar",
        hint: "Hikâyenin geçtiği yerleri atmosferiyle birlikte kaydet.",
      },
      quotes: {
        title: "Alıntılar",
        hint: "Altını çizdiğin cümleleri sayfasıyla ve sahibiyle topla.",
      },
    },
  },

  auth: {
    login: "Giriş Yap",
    register: "Kayıt Ol",
    pleaseWait: "Lütfen bekleyin…",
    identifier: "E-posta veya kullanıcı adı",
    username: "Kullanıcı adı",
    usernamePlaceholder: "okur123",
    email: "E-posta",
    emailPlaceholder: "ornek@eposta.com",
    password: "Şifre",
    usernameHint: (min: number, max: number) =>
      `${min}–${max} karakter; harf, rakam, _ ve . kullanılabilir.`,
    loginRequired: "E-posta/kullanıcı adı ve şifre zorunludur.",
    loginFailed: "E-posta/kullanıcı adı veya şifre hatalı.",
    registerRequired: "Kullanıcı adı, e-posta ve şifre zorunludur.",
    usernameInvalid: (hint: string) => `Kullanıcı adı geçersiz. ${hint}`,
    usernameTaken: "Bu kullanıcı adı alınmış.",
    usernameRace:
      "Kayıt tamamlanamadı; kullanıcı adı az önce alınmış olabilir.",
    passwordTooShort: "Şifre en az 6 karakter olmalıdır.",
    signupNotice:
      "Hesabın oluşturuldu. E-postanı onayladıktan sonra giriş yapabilirsin.",
  },

  dashboard: {
    title: "Kitaplığım",
    fallbackName: "okur",
    greeting: (name: string, bookCount: number) =>
      `Merhaba ${name} — ${bookCount} kitap`,
    emptyTitle: "Henüz kitabın yok",
    emptyHint:
      "İlk kitabını ekleyerek karakterlerini, mekanlarını ve alıntılarını biriktirmeye başla.",
  },

  book: {
    addCta: "+ Kitap Ekle",
    addTitle: "Kitap Ekle",
    editTitle: "Kitabı Düzenle",
    title: "Kitap adı",
    titlePlaceholder: "örn. Dracula",
    author: "Yazar",
    authorPlaceholder: "örn. Bram Stoker",
    startDate: "Başlangıç tarihi",
    status: "Durum",
    cover: "Kapak",
    chooseCover: "Kapak Seç",
    changeCover: "Değiştir",
    removeCover: "Kaldır",
    coverHint: (mb: number) => `PNG, JPEG veya WEBP · en fazla ${mb} MB`,
    coverFailedBookSaved:
      "Kitap eklendi ama kapak yüklenemedi. Tekrar deneyebilir ya da pencereyi kapatıp kapağı sonra ekleyebilirsin.",
    titleAuthorRequired: "Kitap adı ve yazar zorunludur.",
    backToLibrary: "← Kitaplığa dön",
    startedOn: (date: string) => `Başlangıç: ${date}`,
    noContent: "Henüz içerik yok",
    tabsLabel: "Kitap içeriği",
    deleteConfirm: (title: string) =>
      `"${title}" kitabını silmek üzeresin.\n\n` +
      "Bu kitaba bağlı TÜM karakterler, mekanlar ve alıntılar da kalıcı " +
      "olarak silinecek. Bu işlem geri alınamaz.\n\nDevam edilsin mi?",
  },

  finish: {
    cta: "Bitirdim",
    finishedOn: (date: string) => `Bitirdi: ${date}`,
    celebrateTitle: "Tebrikler, bitirdin!",
    celebrateLead: (title: string) =>
      `"${title}" tamamlandı olarak işaretlendi. Nasıldı?`,
    later: "Şimdi değil",
    saveRating: "Puanı kaydet",
  },

  rating: {
    label: "Puan",
    star: (n: number) => `${n} yıldız`,
    outOfFive: (n: number) => `5 üzerinden ${n} yıldız`,
    notRated: "Henüz puan verilmedi",
    invalid: "Geçersiz puan.",
    onlyCompleted: "Yalnızca tamamlanan kitaplar puanlanabilir.",
  },

  bookStatus: {
    reading: "Okunuyor",
    completed: "Tamamlandı",
    want_to_read: "Okunacak",
    paused: "Duraklatıldı",
    dnf: "Yarım bırakıldı",
  },

  // Karakter ve mekan kartları aynı bileşeni paylaşır; türe özgü metinler.
  entityKinds: {
    characters: {
      tab: "Karakterler",
      addCta: "+ Karakter Ekle",
      addTitle: "Karakter ekle",
      editTitle: "Karakter düzenle",
      emptyTitle: "Henüz karakter yok",
      emptyHint:
        "İlk karakter kartını ekle — betimlemesini yaz, istersen bir görsel yükle.",
      count: (n: number) => `${n} karakter`,
      namePlaceholder: "örn. Mina Harker",
      descriptionPlaceholder: "Görünüş, kişilik, önemli özellikler…",
      tagsPlaceholder: "virgülle ayır: Vampir, Antagonist",
    },
    locations: {
      tab: "Mekanlar",
      addCta: "+ Mekan Ekle",
      addTitle: "Mekan ekle",
      editTitle: "Mekan düzenle",
      emptyTitle: "Henüz mekan yok",
      emptyHint:
        "İlk mekan kartını ekle — betimlemesini yaz, istersen bir görsel yükle.",
      count: (n: number) => `${n} mekan`,
      namePlaceholder: "örn. Whitby Manastırı",
      descriptionPlaceholder: "Görünüş, atmosfer, hikâyedeki önemi…",
      tagsPlaceholder: "virgülle ayır: Şato, Köy, Gizemli",
    },
  },

  // Karakter ve mekan için ortak metinler.
  entity: {
    name: "İsim",
    description: "Betimleme",
    tags: "Etiketler",
    image: "Görsel",
    chooseImage: "Görsel Seç",
    noFileChosen: "Dosya seçilmedi",
    currentImageAlt: "Mevcut görsel",
    currentImageHint:
      "Mevcut görsel. Değiştirmek için yeni dosya seç; dokunmazsan korunur.",
    editAria: (name: string) => `${name} düzenle`,
    deleteAria: (name: string) => `${name} sil`,
    deleteConfirm: (name: string) =>
      `"${name}" silinsin mi? Bu işlem geri alınamaz.`,
    nameRequired: "İsim zorunludur.",
  },

  quotes: {
    tab: "Alıntılar",
    addCta: "+ Alıntı Ekle",
    addTitle: "Alıntı ekle",
    content: "Alıntı",
    contentPlaceholder: "Alıntı metnini buraya yaz…",
    pageOrChapter: "Sayfa / Bölüm",
    pageOrChapterPlaceholder: "örn. s. 142 ya da Bölüm 7",
    character: "Karakter (opsiyonel)",
    noCharacterOption: "— karaktere bağlama",
    noCharactersHint: "Bu kitapta henüz karakter yok.",
    emptyTitle: "Henüz alıntı yok",
    emptyHint:
      "Sevdiğin bir cümleyi ekle — sayfa/bölüm ve istersen bir karakterle birlikte.",
    count: (n: number) => `${n} alıntı`,
    deleteAria: "Alıntıyı sil",
    deleteConfirm: "Bu alıntı silinsin mi? Bu işlem geri alınamaz.",
    contentRequired: "Alıntı metni zorunludur.",
    characterNotInBook: "Seçilen karakter bu kitaba ait değil.",
  },

  upload: {
    unauthorized: "Yetkisiz. Giriş gerekli.",
    badBody: "Geçersiz istek gövdesi (multipart/form-data bekleniyor).",
    bookIdRequired: "book_id zorunludur.",
    fileMissing: "Dosya bulunamadı.",
    badType: "Yalnızca PNG, JPEG veya WEBP yüklenebilir.",
    emptyFile: "Dosya boş.",
    tooLarge: (mb: number) => `Dosya ${mb} MB sınırını aşıyor.`,
    failed: "Görsel yüklenemedi.",
  },
};

export type Dictionary = typeof tr;
