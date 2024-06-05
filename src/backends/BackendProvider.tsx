import { useState } from "react";
import { Backend, BackendContext, BackendProviderProps } from "./backends";
import { TauriBackend } from "./tauri";



const BackendProvider = ({children}: BackendProviderProps) => {
  const [backend, setBackend] = useState<Backend>(new TauriBackend());

  return (
    <BackendContext.Provider value={{ backend, setBackend}}>
      {children}
    </BackendContext.Provider>
  );
};

export default BackendProvider;