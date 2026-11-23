import { useStore } from "../state/useStore";
import styles from "./StatIndicators.module.scss";
const { statIndicators, statIndicator } = styles;

const StatIndicators = () => {
  const { typingStats } = useStore();
  const { correctChars, typedChars, timeTyping } = typingStats;

  const words = correctChars / 5;
  const minutes = timeTyping / 60000;

  let wpm = words / minutes;
  let acc = correctChars * 100 / typedChars;

  if (isNaN(wpm)) {
    wpm = 0;
  }

  if (isNaN(acc)) {
    acc = 100;
  }

  return (
    <div className={statIndicators}>
      <StatIndicator text={wpm + "WPM"} />
      <StatIndicator text={acc + "%"} />
    </div>
  );
};

export default StatIndicators;

interface StatIndicatorProps {
  text: string;
}

const StatIndicator = ({ text }: StatIndicatorProps) => {
  return (
    <div className={statIndicator}>
      <span>{text}</span>
    </div>
  );
};
