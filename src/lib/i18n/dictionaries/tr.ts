// Turkish interface strings — the source dictionary. en.ts has to match its
// shape (the Dictionary type) exactly; a missing key is a compile error.
//
// Strings that vary with a number or a name are functions: syntax and plural
// rules differ between languages ("5 karakter" / "5 characters", "X düzenle" /
// "Edit X"), so sentences are never assembled from fragments.

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
    irreversible: "Bu işlem geri alınamaz.",
    moreActions: (name: string) => `${name} için işlemler`,
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
    finishedAt: "Bitiş tarihi",
    finishedAtHint: "Okuma istatistiği bu tarihi kullanır.",
    finishedAtInvalid: "Geçersiz bitiş tarihi.",
    finishedAtFuture: "Bitiş tarihi gelecekte olamaz.",
    finishedBeforeStart: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
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
    deleteTitle: "Kitabı sil",
    deleteBody: (title: string) =>
      `"${title}" ve bu kitaba ait tüm karakterler, mekanlar, alıntılar ve görseller kalıcı olarak silinecek.`,
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

  stats: {
    finishedThisYear: (n: number) =>
      n === 0 ? "Bu yıl henüz kitap bitirmedin" : `Bu yıl ${n} kitap bitirdin`,
    averageRating: (average: string) => `ortalama ${average}`,
    averageRatingLabel: (average: string) =>
      `Bu yıl bitirdiğin kitapların ortalama puanı 5 üzerinden ${average}`,
    missingDates: (n: number) =>
      `${n} tamamlanan kitabın bitiş tarihi yok, bu yüzden sayılmıyor. Düzenleyerek tarih ekleyebilirsin.`,
  },

  library: {
    filterLabel: "Duruma göre filtrele",
    all: "Tümü",
    searchLabel: "Kitaplarda ara",
    searchPlaceholder: "Kitap adı ya da yazar",
    showing: (shown: number, total: number) =>
      `${total} kitaptan ${shown} tanesi gösteriliyor`,
    noResultsTitle: "Eşleşen kitap yok",
    noResultsHint: "Farklı bir arama dene ya da filtreleri temizle.",
    clearFilters: "Filtreleri temizle",
  },

  bookStatus: {
    reading: "Okunuyor",
    completed: "Tamamlandı",
    want_to_read: "Okunacak",
    paused: "Duraklatıldı",
    dnf: "Yarım bırakıldı",
  },

  // Characters and locations share one component; these are the kind-specific strings.
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
      deleteTitle: "Karakteri sil",
      // Quotes survive: quotes.character_id is ON DELETE SET NULL.
      deleteBody: (name: string) =>
        `"${name}" kartı ve görseli kalıcı olarak silinecek. Bu karaktere bağlı alıntılar silinmez, yalnızca karakter bağlantıları kalkar.`,
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
      deleteTitle: "Mekanı sil",
      deleteBody: (name: string) =>
        `"${name}" kartı ve görseli kalıcı olarak silinecek.`,
      namePlaceholder: "örn. Whitby Manastırı",
      descriptionPlaceholder: "Görünüş, atmosfer, hikâyedeki önemi…",
      tagsPlaceholder: "virgülle ayır: Şato, Köy, Gizemli",
    },
  },

  // Strings shared by characters and locations.
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
    deleteTitle: "Alıntıyı sil",
    deleteBody: (excerpt: string) => `“${excerpt}” kalıcı olarak silinecek.`,
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
