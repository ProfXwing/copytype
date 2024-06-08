import classNames from "classnames";
import { faChartBar, faKeyboard, faPlus, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

import styles from "./Library.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useBackend } from "../../backends/BackendContext";
import { useEffect, useState } from "react";
import { MetaData } from "./book";
import { Link } from "react-router-dom";
const { newBook, plusWrapper, titleWrapper, bookChoice, coverImage, libraryBooks, bookButtons } = styles;

const Library = () => {
  return (
    <BooksList />
  );
};

const BooksList = () => {
  const [needsReload, setNeedsReload] = useState(true);
  const [bookList, setBookList] = useState<MetaData[]>([]);
  const { backend } = useBackend();

  useEffect(() => {
    if (needsReload) {
      setNeedsReload(false);

      (async () => {
        setBookList(await backend.getBookList());
      })();
    }
  }, [needsReload, backend]);

  return (
    <div className={libraryBooks}>
      {bookList.map((book, index) => (
        <Book key={index} book={book} />
      ))}
    
      <div
        onClick={async () => {
          await backend.uploadBook();
          setNeedsReload(true);
        }} 
        className={classNames(newBook, bookChoice)}>
        <div className={plusWrapper}>
          <FontAwesomeIcon icon={faPlus} />
        </div>
        <div className={titleWrapper}>
          <label>Upload Book</label>
        </div>
      </div>
    </div>
  );
};

const Book = ({ book }: { book: MetaData }) => {
  return (
    <div className={bookChoice}>
      <div className={coverImage}>
        <h1>{book.title}</h1>
      </div>
      <div className={titleWrapper}>
        <label>{book.title}</label>
      </div>
      <div className={bookButtons}>
        <Link 
        to={`/typing`} 
        state={{
          bookName: book.bookName
        }}>
          <FontAwesomeIcon icon={faKeyboard} />
        </Link>
        <FontAwesomeIcon icon={faChartBar} />
        <FontAwesomeIcon icon={faTrashAlt} />
      </div>
    </div>
  );
};

export default Library;