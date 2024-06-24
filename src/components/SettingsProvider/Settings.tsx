/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { Optional } from "../options";

// These settings should match JSON and backend
export interface Settings {
  recentBooks: string[];
}

type SettingsContextType = {
  settings: Optional<Settings>,
  setSettings: (settings: Settings) => void,
}

export const SettingsContext = createContext<SettingsContextType>({ settings: Optional.none(), setSettings: () => { } });


export const useSettings = () => {
  return useContext(SettingsContext);
};


