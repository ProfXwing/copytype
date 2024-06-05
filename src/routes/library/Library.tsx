import classNames from "classnames";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

import styles from "./Library.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Layout from "../../components/Layout/Layout";
import { useBackend } from "../../backends/BackendContext";
const { newBook, plusWrapper, titleWrapper, bookChoice } = styles;


const Library = () => {
  return (
    <Layout>
      <BooksList />
    </Layout>
  );
};

const BooksList = () => {
  const { backend } = useBackend();

  return (
    <div
      onClick={() => {
        backend.uploadBook();
      }} 
      className={classNames(newBook, bookChoice)}>
      <div className={plusWrapper}>
        <FontAwesomeIcon icon={faPlus} />
      </div>
      <div className={titleWrapper}>
        <label>Upload Book</label>
      </div>
    </div>
  );
};

export default Library;