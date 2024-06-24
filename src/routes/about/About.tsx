import classNames from "classnames";

import styles from "./About.module.scss";
const { section, title, body } = styles;

const About = () => {
  return (
    <>
      <InfoSection header="about">
        <p>
          Copytype is essentially a direct clone of <a target="_blank" href="https://monkeytype.com">Monkeytype</a>.
          Its purpose is to let you import and type any ebook, using Monkeytype's typing interface.
        </p>
      </InfoSection>

      <InfoSection header="credit">
        <p>
          This project would not be possible without Miodec, the creator of Monkeytype.
          Very huge thank you to you for everything that you do for the typing community,
          and thank you for letting me copy your website.
        </p>
      </InfoSection>

      <InfoSection header="stats">
        <p>
          chars typed - total characters typed <br />
          sessions - times opened the book <br />
          wpm - total amount of characters in the correctly typed words (including spaces),
          divided by 5 and normalised to 60 seconds. <br />
          raw wpm - calculated just like wpm, but also includes incorrect words. <br />
          acc - percentage of correctly pressed keys.
        </p>
      </InfoSection>

      <InfoSection header="bug report or feature request">
        <p>
          If you encounter a bug, or have a feature request,
          you can join my&nbsp;

          <a href="https://discord.gg/zQAWJjn2QJ" target="_blank">
            discord server
          </a>,

          message me on discord,
          or create an issue on Github.
        </p>
      </InfoSection>
    </>
  );
};

export interface InfoSectionProps {
  header: string;
  children: React.ReactNode;
}

export const InfoSection = ({ header, children }: InfoSectionProps) => {
  return (
    <div className={classNames(section, styles[header])}>
      <div className={title}>
        {header}
      </div>

      <div className={body}>
        {children}
      </div>
    </div>
  );
};

export default About;
