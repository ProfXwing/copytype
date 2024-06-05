import { useContext } from "react";
import { BackendContext } from "./backends";

export const useBackend = () => {
  return useContext(BackendContext);
};