import styles from "./StatIndicators.module.scss";
const { statIndicators, statIndicator } = styles;

const StatIndicators = () => {
  return (
    <div className={statIndicators}>
      <StatIndicator text={"100WPM"} />
      <StatIndicator text={"100%"} />
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