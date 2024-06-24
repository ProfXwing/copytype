import { useEffect, useState } from "react";
import { Settings, SettingsContext } from "./Settings";
import { useBackend } from "../../backends/BackendContext";
import { Optional } from "../options";


export interface SettingsProviderProps {
  children: React.ReactNode
}

const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettingsState] = useState(Optional.none<Settings>());
  const { backend } = useBackend();

  useEffect(() => {
    (async () => {
      const fetchedSettings: Optional<Settings> = await backend.getSettings();
      setSettingsState(fetchedSettings);
    })();
  }, [backend]);

  const setSettings = async (newSettings: Settings) => {
    backend.setSettings(newSettings);
    setSettingsState(Optional.some(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
