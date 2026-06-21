export type Quote = {
  id: string;
  book_id: string;
  character_id: string | null;
  content: string;
  page_or_chapter: string | null;
  created_at: string;
};
