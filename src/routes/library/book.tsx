import { Option } from "../../components/options";

// This should match the structure of the book JSON file, same in the backend.

export interface Book {
  content: string[];
  metadata: MetaData; 
}

export interface MetaData {
  bookName: string;
  title: string;
  author: Option<string>;
  dateWritten: Option<string>;
  numChapters: number;
  dateParsed: number;
}