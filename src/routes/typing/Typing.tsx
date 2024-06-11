import { useEffect, useState } from "react";
import Caret from "../../components/Caret/Caret";
import PageNavigators from "../../components/PageNavigators/PageNavigators";
import { useSettings } from "../../components/SettingsProvider/Settings";
import StatIndicators from "../../components/StatIndicators/StatIndicators";

import styles from "./Typing.module.scss";
import { useBackend } from "../../backends/BackendContext";
const { wordsContainer, wordDiv } = styles;

export const Typing = () => {
  const { settings } = useSettings();
  const { backend } = useBackend();

  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      const fetchedBook = await backend.getBook(settings.recentBooks[0]);

      if (fetchedBook.isSome()) {
        const newText = fetchedBook.unwrap().chapters[0];
        setText(newText);
      }
    })();
  }, [backend, settings]);

  const displayedWords = text.slice(0, 500);

  return (
    <>
      <PageNavigators />
      <StatIndicators />
      <Words text={displayedWords} />
      <Caret />
    </>
  );
};

interface WordsProps {
  text: string;
}

const Words = ({ text }: WordsProps) => {
  const words = text.split(" ");

  return (
    <div className={wordsContainer}>
      {words.map((word, index) => (
        <Word key={index} word={word} />
      ))}
    </div>
  );
};

const Word = ({ word }: { word: string }) => {
  const characters = word.split("");

  return (
    <div className={wordDiv}>
      {characters.map((character, index) => (
        <span key={index}>{character}</span>
      ))}
    </div>
  );
};

