import { createContext } from "react";
import { TauriBackend } from "./tauri";

export interface Backend {
  uploadBook: () => Promise<void>;
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