import styles from "./PageNavigators.module.scss";
const { pageSelectors, pageNavigator, pageButtons } = styles;

const PageNavigators = () => {
  return (
    <div className={pageSelectors}>
      <PageNavigator text="<<" onClick={() => {
        console.log("Previous chapter.");
      }}/>

      <div className={pageButtons}>
        <PageNavigator text="<" onClick={() => {
          console.log("Previous page.");
        }}/>

        <PageNavigator text=">" onClick={() => {
          console.log("Next page.");
        }}/>
      </div>

      <PageNavigator text=">>" onClick={() => {
        console.log("Next chapter.");
      }}/>
    </div>
  );
};

export default PageNavigators;

interface PageNavigatorProps {
  text: string;
  onClick: () => void;
}

const PageNavigator = ({ text, onClick }: PageNavigatorProps) => {
  return (
    <div className={pageNavigator} onClick={onClick}>
      <span>{text}</span>
    </div>
  );
};