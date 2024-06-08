import { BrowserRouter, Route, Routes } from "react-router-dom";
import Library from "./routes/library/Library";
import About from "./routes/about/About";
import { Typing } from "./routes/typing/Typing";
import Layout from "./components/Layout/Layout";

const Router = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/about" element={<About />} />
          <Route path="/typing" element={<Typing />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};


export default Router;