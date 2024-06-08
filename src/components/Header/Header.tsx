import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCog, faInfo, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import styles from './Header.module.scss';
import { Link } from 'react-router-dom';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
const { header, headerName, headerButton } = styles;

export interface HeaderProps {

}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <div className={header}>
      <div className={headerName}>
        copytype
      </div>

      <HeaderButton href="/typing" icon={faKeyboard} />
      <HeaderButton href="/" icon={faBook} /> {/* library */}
      <HeaderButton href="/about" icon={faInfo} />
      <HeaderButton href="/settings" icon={faCog} />
    </div>
  );
};

export interface HeaderButtonProps {
  href: string;
  icon: IconProp;
}

export const HeaderButton: React.FC<HeaderButtonProps> = (props) => {
  return (
    <Link to={props.href}>
      <div className={headerButton}>
        <FontAwesomeIcon icon={props.icon} fixedWidth/>
      </div>
    </Link>
  );
};
