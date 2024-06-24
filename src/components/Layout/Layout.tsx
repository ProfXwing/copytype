import BackendProvider from "../../backends/BackendProvider";
import { Header } from "../Header/Header";
import SettingsProvider from "../SettingsProvider/SettingsProvider";
import ThemeProvider from "../ThemeProvider/ThemeProvider";

export interface LayoutProps {
  children: React.ReactNode
}

const Layout = (props: LayoutProps) => {
  return (
    <ThemeProvider>
      <BackendProvider>
        <SettingsProvider>
          <Header />
          {props.children}
        </SettingsProvider>
      </BackendProvider>
    </ThemeProvider>
  );
};

export default Layout;