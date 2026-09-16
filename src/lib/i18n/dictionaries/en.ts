import type { Dictionary } from "./tr";

// İngilizce arayüz metinleri. Tip Dictionary olduğu için tr.ts'e eklenen
// her anahtar burada da zorunlu.
//
// "Mekan" bilerek "Place" (Location değil): bir okurun ağzından daha doğal.

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const en: Dictionary = {
  meta: {
    description:
      "Visualize the characters, places and quotes of the books you read.",
  },

  common: {
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    saving: "Saving…",
    deleting: "Deleting…",
    logout: "Sign Out",
    themeToggle: "Toggle light/dark theme",
  },

  locale: {
    label: "Language",
    names: { tr: "Türkçe", en: "English" },
  },

  errors: {
    sessionMissing: "Session not found. Please sign in again.",
    bookIdMissing: "Book ID is missing.",
    cardIdMissing: "Card ID is missing.",
    bookNotFound: "Book not found, or you don't have access to it.",
    invalidKind: "Invalid type.",
    invalidImageSource: "Invalid image source.",
    serviceUnavailable: "Something went wrong. Please try again.",
  },

  landing: {
    eyebrow: "A visual reading journal",
    titleBefore: "Remember the books you read by ",
    titleHighlight: "seeing",
    titleAfter: " them.",
    lead: "Collect characters, places and the lines you underlined in a single journal, and bring each one to life with images you choose.",
    features: {
      characters: {
        title: "Characters",
        hint: "Who was who? Keep their face, personality and tags.",
      },
      locations: {
        title: "Places",
        hint: "Record where the story unfolds, atmosphere and all.",
      },
      quotes: {
        title: "Quotes",
        hint: "Gather the lines you underlined, with their page and speaker.",
      },
    },
  },

  auth: {
    login: "Sign In",
    register: "Sign Up",
    pleaseWait: "Please wait…",
    identifier: "Email or username",
    username: "Username",
    usernamePlaceholder: "reader123",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    usernameHint: (min, max) =>
      `${min}–${max} characters; letters, numbers, _ and . allowed.`,
    loginRequired: "Email/username and password are required.",
    loginFailed: "Incorrect email/username or password.",
    registerRequired: "Username, email and password are required.",
    usernameInvalid: (hint) => `Invalid username. ${hint}`,
    usernameTaken: "That username is taken.",
    usernameRace:
      "Sign-up couldn't be completed; the username may have just been taken.",
    passwordTooShort: "Password must be at least 6 characters.",
    signupNotice:
      "Your account has been created. You can sign in after confirming your email.",
  },

  dashboard: {
    title: "My Library",
    fallbackName: "reader",
    greeting: (name, bookCount) =>
      `Hi ${name} — ${plural(bookCount, "book", "books")}`,
    emptyTitle: "No books yet",
    emptyHint:
      "Add your first book to start collecting its characters, places and quotes.",
  },

  book: {
    addCta: "+ Add Book",
    addTitle: "Add Book",
    editTitle: "Edit Book",
    title: "Title",
    titlePlaceholder: "e.g. Dracula",
    author: "Author",
    authorPlaceholder: "e.g. Bram Stoker",
    startDate: "Start date",
    status: "Status",
    titleAuthorRequired: "Title and author are required.",
    backToLibrary: "← Back to library",
    startedOn: (date) => `Started ${date}`,
    noContent: "Nothing added yet",
    tabsLabel: "Book contents",
    deleteConfirm: (title) =>
      `You're about to delete "${title}".\n\n` +
      "ALL characters, places and quotes in this book will be permanently " +
      "deleted too. This can't be undone.\n\nContinue?",
  },

  bookStatus: {
    reading: "Reading",
    completed: "Finished",
    want_to_read: "Want to read",
    paused: "Paused",
    dnf: "Did not finish",
  },

  entityKinds: {
    characters: {
      tab: "Characters",
      addCta: "+ Add Character",
      addTitle: "Add character",
      editTitle: "Edit character",
      emptyTitle: "No characters yet",
      emptyHint:
        "Add your first character card — write a description and upload an image if you like.",
      count: (n) => plural(n, "character", "characters"),
      namePlaceholder: "e.g. Mina Harker",
      descriptionPlaceholder: "Appearance, personality, key traits…",
      tagsPlaceholder: "comma-separated: Vampire, Antagonist",
    },
    locations: {
      tab: "Places",
      addCta: "+ Add Place",
      addTitle: "Add place",
      editTitle: "Edit place",
      emptyTitle: "No places yet",
      emptyHint:
        "Add your first place card — write a description and upload an image if you like.",
      count: (n) => plural(n, "place", "places"),
      namePlaceholder: "e.g. Whitby Abbey",
      descriptionPlaceholder: "Appearance, atmosphere, role in the story…",
      tagsPlaceholder: "comma-separated: Castle, Village, Mysterious",
    },
  },

  entity: {
    name: "Name",
    description: "Description",
    tags: "Tags",
    image: "Image",
    chooseImage: "Choose Image",
    noFileChosen: "No file chosen",
    currentImageAlt: "Current image",
    currentImageHint:
      "Current image. Choose a new file to replace it; otherwise it stays.",
    editAria: (name) => `Edit ${name}`,
    deleteAria: (name) => `Delete ${name}`,
    deleteConfirm: (name) => `Delete "${name}"? This can't be undone.`,
    nameRequired: "Name is required.",
  },

  quotes: {
    tab: "Quotes",
    addCta: "+ Add Quote",
    addTitle: "Add quote",
    content: "Quote",
    contentPlaceholder: "Type the quote here…",
    pageOrChapter: "Page / Chapter",
    pageOrChapterPlaceholder: "e.g. p. 142 or Chapter 7",
    character: "Character (optional)",
    noCharacterOption: "— no character",
    noCharactersHint: "This book has no characters yet.",
    emptyTitle: "No quotes yet",
    emptyHint:
      "Add a line you loved — with its page or chapter and, if you like, a character.",
    count: (n) => plural(n, "quote", "quotes"),
    deleteAria: "Delete quote",
    deleteConfirm: "Delete this quote? This can't be undone.",
    contentRequired: "Quote text is required.",
    characterNotInBook: "The selected character doesn't belong to this book.",
  },

  upload: {
    unauthorized: "Unauthorized. Please sign in.",
    badBody: "Invalid request body (multipart/form-data expected).",
    bookIdRequired: "book_id is required.",
    fileMissing: "No file found.",
    badType: "Only PNG, JPEG or WEBP files can be uploaded.",
    emptyFile: "The file is empty.",
    tooLarge: (mb) => `The file exceeds the ${mb} MB limit.`,
    failed: "The image couldn't be uploaded.",
  },
};
