import { Ref, RefObject, forwardRef, useCallback, useEffect, useState } from "react";

import PageNavigators from "../../components/PageNavigators/PageNavigators";
import { useSettings } from "../../components/SettingsProvider/Settings";
import StatIndicators from "../../components/StatIndicators/StatIndicators";

import styles from "./Typing.module.scss";
import { useBackend } from "../../backends/BackendContext";
import { BookText } from "../../components/bookText";
import { Optional } from "../../components/options";
import { handleKeyPress, handleKeyDown } from "../../components/keypress";
const { wordsContainer, wordDiv, typingPage } = styles;

export const Typing = () => {
  const { settings } = useSettings();
  const { backend } = useBackend();

  const [bookText, setBookText] = useState(Optional.none<BookText>());
  const [typedChars, setTypedChars] = useState<string[]>([]);

  const [loadingPage, setLoadingPage] = useState(true);
  const [displayedWords, setDisplayedWords] = useState("");
  const [wordRefsGrid, setWordRefsGrid] = useState<RefObject<HTMLDivElement>[][]>([]);


  // fetch the book and initialize its handler
  useEffect(() => {
    if (settings.isNone()) return;

    (async () => {
      console.log("Fetching book...");
      const fetchedBook = await backend.getBook(settings.unwrap().recentBooks[0]);

      if (!fetchedBook.isSome()) {
        console.error("Failed to fetch book");
        return;
      }

      const content = fetchedBook.unwrap().chapters[0];
      const newText = new BookText(content, 0);

      setBookText(Optional.some(newText));
      setDisplayedWords(newText.getDisplayedWords());

      const refs = newText.createWordRefs(newText.getDisplayedWords());
      setWordRefsGrid(refs);
    })();
  }, [backend, settings]);


  // ensure window has a full page of words, with no overflow
  const initWindow = useCallback(() => {
    if (bookText.isNone() || loadingPage === false) return;

    const { displayedWords, refs, stillLoading } = bookText.unwrap().updateDisplay(wordRefsGrid);

    setLoadingPage(stillLoading);
    setDisplayedWords(displayedWords);
    setWordRefsGrid(refs);
  }, [wordRefsGrid, bookText, loadingPage]);

  // initialize window and add resize listener
  useEffect(() => {

    // debounce resize event because initWindow is fairly expensive
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        setLoadingPage(true);
        initWindow();
      }, 50);
    };
    initWindow();

    // add resize listener
    window.addEventListener("resize", handleResize);

    // cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [initWindow]);


  // handle keypresses
  useEffect(() => {
    const keypress = (e: KeyboardEvent) => handleKeyPress(e, typedChars, setTypedChars);
    const keydown = (e: KeyboardEvent) => handleKeyDown(e, typedChars, setTypedChars);

    window.addEventListener("keypress", keypress);
    window.addEventListener("keydown", keydown);

    return () => {
      window.removeEventListener("keypress", keypress);
      window.removeEventListener("keydown", keydown);
    };
  }, [typedChars]);


  return (
    <div className={typingPage}>
      <PageNavigators />
      <StatIndicators />

      {bookText.isSome() &&
        <WordsContainer text={displayedWords} wordRefsGrid={wordRefsGrid} />
      }
    </div>
  );
};

const WordsContainer = ({ wordRefsGrid, text }: {
  wordRefsGrid: RefObject<HTMLDivElement>[][];
  text: string;
}) => {
  const lines = text.split("\n");

  return (
    <div className={wordsContainer}>
      {lines.map((line, index) => {
        const words = line.split(" ");
        const wordRefs = wordRefsGrid[index];

        return (
          <Line key={index} words={words} wordRefs={wordRefs} />
        );
      })}
    </div>
  );
};

const Line = ({ wordRefs, words }: {
  wordRefs: RefObject<HTMLDivElement>[];
  words: string[];
}) => {
  return (
    <div>
      {words.map((word, index) => {
        return (
          <Word key={index} word={word} ref={wordRefs[index]} />
        );
      })}
    </div>
  );
};

const Word = forwardRef(({ word }: {
  word: string
}, ref: Ref<HTMLDivElement>) => {
  const characters = word.split("");

  return (
    <div className={wordDiv} ref={ref}>
      {characters.map((character, index) => {
        return (
          <span key={index}>
            {character}
          </span>
        );
      })}
    </div>
  );
});

