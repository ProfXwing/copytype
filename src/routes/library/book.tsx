import { Optional } from "../../components/options";

// This should match the structure of the book JSON file, same in the backend.

export interface Book {
  chapters: string[];
  metadata: Metadata;
}

export interface Metadata {
  bookName: string;
  title: string;
  author: Optional<string>;
  dateWritten: Optional<string>;
  numChapters: number;
  dateParsed: number;
}
