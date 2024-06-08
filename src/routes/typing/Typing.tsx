// import { useLocation } from "react-router-dom";
import { Caret } from "../../components/Caret/Caret";
import { PageNavigators } from "../../components/PageNavigators/PageNavigators";
import { StatIndicators } from "../../components/StatIndicators/StatIndicators";

import styles from "./Typing.module.scss";
const { wordsContainer, wordDiv } = styles;

export const Typing = () => {
  // const state: {
  //   bookName: string | null
  // } = useLocation().state;


  return (
    <>
      <PageNavigators />
      <StatIndicators />
      <Words />
      <Caret />
    </>
  );  
};


const Words = () => {
  const text = "Hello, world!";
  const words = text.split(" ");

  return (
    <div className={wordsContainer}>
      {words.map((word, index) => (
        <Word key={index} word={word} />
      ))}
    </div>
  );
};

const Word = ({ word }: {word: string}) => {
  const characters = word.split("");

  return (
    <div className={wordDiv}>
      {characters.map((character, index) => (
        <span key={index}>{character}</span>
      ))}
    </div>
  );
};

