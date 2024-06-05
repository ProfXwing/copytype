import { BrowserRouter, Route, Routes } from "react-router-dom";
import Library from "./routes/library/Library";
import About from "./routes/about/About";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;