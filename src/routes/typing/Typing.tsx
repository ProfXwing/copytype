import { useRef } from "react";
import PageNavigators from "../../components/PageNavigators/PageNavigators";
import { useSettings } from "../../components/SettingsProvider/Settings";
import StatIndicators from "../../components/StatIndicators/StatIndicators";
import { useBackend } from "../../backends/BackendContext";
import Caret from "../../components/Caret/Caret";
import WordsContainer from "../../components/WordsContainer/WordsContainer";

import styles from "./Typing.module.scss";
import useBookText from "../../components/hooks/useBookText";
import useKeyHandler from "../../components/hooks/useKeyHandler";
import usePageSizing from "../../components/hooks/usePageSizing";
const { typingPage } = styles;


export const Typing = () => {
  const { settings } = useSettings();
  const { backend } = useBackend();

  const wordsContainerRef = useRef<HTMLDivElement>(null);

  const bookText = useBookText(backend, settings);
  const { displayedText, nextPage } = usePageSizing(bookText, wordsContainerRef);
  useKeyHandler();

  return (
    <div className={typingPage}>
      {bookText.isSome() && (
        <>
          <PageNavigators nextPage={nextPage} />
          <StatIndicators />

          <WordsContainer displayedText={displayedText} ref={wordsContainerRef} />
          <Caret wordsContainerRef={wordsContainerRef} displayedText={displayedText} />
        </>
      )}
    </div>
  );
};


