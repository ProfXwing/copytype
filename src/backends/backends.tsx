import { createContext } from "react";
import { TauriBackend } from "./tauri";
import { MetaData } from "../routes/library/book";

export interface Backend {
  uploadBook: () => Promise<void>;
  getBookList: () => Promise<MetaData[]>;
}

export interface BackendContextType {
  backend: Backend,
  setBackend: (backend: Backend) => void,
}

export const BackendContext = createContext<BackendContextType>({
  backend: new TauriBackend(),
  setBackend: () => {},
});

export interface BackendProviderProps {
  children: React.ReactNode
}