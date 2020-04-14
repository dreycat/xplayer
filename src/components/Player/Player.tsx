import React, { useRef } from 'react';

import Window from '../Window';
import { usePlayer } from '../../hooks/usePlayer';
import playlist from './playlist';
import Controlls from './Controlls';
import Playlist from './Playlist';
import VolumeControl from './VolumeControl';
import Screen from './Screen';
import Marquee from './Marquee';
import Progress from './Progress';
import HeaderLayout from './Layouts/HeaderLayout';
import styles from './Player.module.css';

const Player = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    audio,
    state: { time, isPlaying, isError, isRadio, currentTrack, volume },
    controlles: { play, pause, nextTrack, prevTrack, changeTrack, changeVolume, seek },
  } = usePlayer();

  const screen = <Screen isPlaying={isPlaying} isRadio={isRadio} time={time} />;

  const marquee = <Marquee isError={isError}>{currentTrack.title}</Marquee>;

  const volumeControl = <VolumeControl changeVolume={changeVolume} volume={volume} />;

  const controlls = (
    <Controlls play={play} pause={pause} nextTrack={nextTrack} prevTrack={prevTrack} isPlaing={isPlaying} />
  );

  const progress = (
    <Progress
      duration={audioRef.current?.duration ?? 0}
      currentTime={audioRef.current?.currentTime ?? 0}
      isRadio={isRadio}
      seek={seek}
    />
  );

  return (
    <Window label="xaudio" className={styles.position}>
      <div className={styles.main}>
        {audio}
        <HeaderLayout
          screen={screen}
          marquee={marquee}
          volumeControl={volumeControl}
          controlls={controlls}
          progress={progress}
        />
        <Playlist list={playlist} currentTrackId={currentTrack.id} changeTrack={changeTrack} />
      </div>
    </Window>
  );
};

export default Player;
