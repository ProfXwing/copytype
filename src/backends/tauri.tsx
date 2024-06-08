import { Option } from '../components/options';
import { MetaData } from '../routes/library/book';
import { Backend } from './backends';
import { invoke } from '@tauri-apps/api';

interface ErrorData {
  message: string,
  code: number
}

enum Error {
  Io = 0,
  NoFileSelected = 1,
}

export function logError(errorData: ErrorData) {
  const error = Error[errorData.code];
  console.log({
    error,
    ...errorData,
  });
}

export class TauriBackend implements Backend {
  uploadBook = async () => {
    invoke('upload_book').catch((errorData: ErrorData) => {
      logError(errorData);
    });
  };  

  getBookList = async () => {
    console.log("getting book list");
    const data = await invoke<{
      book_name: string;
      title: string;
      author: string | null;
      date_written: string | null;
      num_chapters: number;
      date_parsed: number;
    }[]>('get_book_list').catch((errorData: ErrorData) => {
      logError(errorData);
      return [];
    });

    return data.map((book) => {
      return {
        bookName: book.book_name,
        title: book.title,
        author: Option.some(book.author),
        dateWritten: Option.some(book.date_written),
        numChapters: book.num_chapters,
        dateParsed: book.date_parsed
      } as MetaData;
    });
  };
}