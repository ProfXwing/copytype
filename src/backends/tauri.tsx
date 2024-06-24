import { Optional } from '../components/options';
import { Settings } from '../components/SettingsProvider/Settings';
import { Book, Metadata } from '../routes/library/book';
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
    errorData,
  });
}

export class TauriBackend implements Backend {
  uploadBook = async () => {
    invoke('upload_book').catch((errorData: ErrorData) => {
      console.error("Error uploading book");
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
      console.error("Error getting book list");
      logError(errorData);
      return [];
    });

    return data.map((book) => {
      return {
        bookName: book.book_name,
        title: book.title,
        author: Optional.some(book.author),
        dateWritten: Optional.some(book.date_written),
        numChapters: book.num_chapters,
        dateParsed: book.date_parsed
      } as Metadata;
    });
  };

  getBook = async (bookName: string) => {
    const data = await invoke<Book>("get_book", { bookName }).catch((errorData: ErrorData) => {
      console.error("Error getting book");
      logError(errorData);
      return null;
    });

    if (!data) {
      return Optional.none<Book>();
    }

    return Optional.some<Book>(data);
  };

  getSettings = async () => {
    const data = await invoke<Settings>('get_settings').catch((errorData: ErrorData) => {
      console.error("Error getting settings");
      logError(errorData);
      return null;
    });

    if (!data) {
      return Optional.none<Settings>();
    }

    return Optional.some<Settings>(data);
  };

  setSettings = async (settings: Settings) => {
    invoke('set_settings', { settings }).catch((errorData: ErrorData) => {
      console.error("Error setting settings");
      logError(errorData);
    });
  };
}
