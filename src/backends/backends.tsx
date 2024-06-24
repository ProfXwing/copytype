import { createContext } from "react";
import { TauriBackend } from "./tauri";
import { Book, Metadata } from "../routes/library/book";
import { Optional } from "../components/options";
import { Settings } from "../components/SettingsProvider/Settings";

export interface Backend {
  uploadBook: () => Promise<void>;
  getBookList: () => Promise<Metadata[]>;
  getBook: (bookName: string) => Promise<Optional<Book>>;
  getSettings: () => Promise<Optional<Settings>>;
  setSettings: (settings: Settings) => Promise<void>;
}

export interface BackendContextType {
  backend: Backend,
  setBackend: (backend: Backend) => void,
}

export const BackendContext = createContext<BackendContextType>({
  backend: new TauriBackend(),
  setBackend: () => { },
});

export interface BackendProviderProps {
  children: React.ReactNode
}
