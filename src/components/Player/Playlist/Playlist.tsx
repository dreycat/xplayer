import React, { FC } from 'react';

import styles from './Playlist.module.css';
import { ITrack } from '../interfaces';

interface IProps {
  list: ITrack[];
  currentTrackId: number;
  changeTrack: (id: number) => void;
}

const Playlist: FC<IProps> = ({ list, currentTrackId, changeTrack }) => (
  <div className={styles.main}>
    <ul className={`${styles.playlist} border`}>
      {list.map(({ name, title, id }) => (
        <li
          className={id === currentTrackId ? `${styles.track} ${styles.current}` : styles.track}
          title={title}
          key={id}
          onClick={() => changeTrack(id)}
        >
          {name}
        </li>
      ))}
    </ul>
  </div>
);

export default Playlist;
