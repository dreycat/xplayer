import React, { FC } from 'react';

import styles from './Marquee.module.css';

interface IProps {
  isError: boolean;
}

const Marquee: FC<IProps> = ({ children, isError }) => (
  <div className={`${styles.main} border`}>
    <div className={styles.inner}>
      <p className={styles.text}>
        {isError ? (
          <span className={styles.error}>We're sorry, but there was an error processing your request.</span>
        ) : (
          children
        )}
      </p>
    </div>
  </div>
);

export default Marquee;
