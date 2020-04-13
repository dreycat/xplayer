import React, { useRef, useEffect, useState } from 'react';

import Window from '../Window';
import { usePlayer } from '../hooks/usePlayer';
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
  const [time, setTime] = useState(0);
  const [state, send] = usePlayer();

  const { isRadio } = state.context.currentTrack;
  const isPlaying = state.matches('playing');
  const isError = state.matches('failure');

  console.log('value: ', state.value);

  useEffect(() => {
    if (state.value !== 'failure') return;

    const id = setTimeout(() => {
      send({ type: 'RETRY', audioEl: audioRef.current });
    }, 3000);

    return () => clearTimeout(id);
  }, [state.value, send]);

  const screen = <Screen isPlaying={isPlaying} isRadio={isRadio} time={time} />;

  const marquee = <Marquee isError={isError}>{state.context.currentTrack.title}</Marquee>;

  const volumeControl = (
    <VolumeControl setVolume={(volume) => send({ type: 'CHANGE_VOLUME', volume })} volume={state.context.volume} />
  );

  const controlls = (
    <Controlls
      play={() => send('PLAY')}
      pause={() => send('PAUSE')}
      nextTrack={() => send('NEXT_TRACK')}
      prevTrack={() => send('PREV_TRACK')}
      isPlaing={isPlaying}
    />
  );

  const progress = (
    <Progress
      duration={audioRef.current?.duration ?? 0}
      currentTime={audioRef.current?.currentTime ?? 0}
      isRadio={isRadio}
      seek={(currentTime) => send({ type: 'SET_CURRENT_TIME', currentTime })}
    />
  );

  return (
    <Window label="xaudio" className={styles.position}>
      <div className={styles.main}>
        <audio
          ref={audioRef}
          src={state.context.currentTrack.url}
          onEnded={() => send('END')}
          onError={() => send('FAIL')}
          autoPlay={state.matches('playing')}
          onCanPlay={() => send({ type: 'LOADED', audioEl: audioRef.current })}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        />
        <HeaderLayout
          screen={screen}
          marquee={marquee}
          volumeControl={volumeControl}
          controlls={controlls}
          progress={progress}
        />
        <Playlist
          list={playlist}
          currentTrack={state.context.currentTrack.id}
          setTrack={(id) => send({ type: 'CHANGE_TRACK', id })}
        />
      </div>
    </Window>
  );
};

export default Player;
