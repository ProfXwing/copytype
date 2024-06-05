import BackendProvider from "../../backends/BackendProvider";
import { Header } from "../Header/Header";
import ThemeProvider from "../ThemeProvider/ThemeProvider";

export interface LayoutProps {
  children: React.ReactNode
}

const Layout = (props: LayoutProps) => {
  return (
    <ThemeProvider>
      <BackendProvider>
        <Header />
        {props.children}
      </BackendProvider>
    </ThemeProvider>
  );
};

export default Layout;