import React, { FC } from 'react';

import transformTime from '../../../utils/transformTime';
import styles from './Screen.module.css';

interface IProps {
  isPlaying: boolean;
  isRadio: boolean;
  currentTime: number;
}

const Screen: FC<IProps> = ({ currentTime, isPlaying, isRadio }) => (
  <div className={`${styles.main} border`}>
    {isRadio && <span className={styles.radio}>radio</span>}
    {isPlaying ? <span className={styles.play} /> : <span className={styles.pause} />}
    <span className={styles.prettyTime}>{transformTime(currentTime)}</span>
  </div>
);

export default Screen;
