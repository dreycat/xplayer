import React, { useRef, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';

import playlist from './playlist';
import { ITrack } from './types';

interface IContext {
  audioRef: HTMLAudioElement | null;
  currentTrack: ITrack;
  volume: number;
}

const getPlaylistTransitions = (target: string) => ({
  PREV_TRACK: {
    target,
    actions: 'prevTrack',
  },
  NEXT_TRACK: {
    target,
    actions: 'nextTrack',
  },
  CHANGE_TRACK: {
    target,
    actions: 'changeTrack',
  },
});

const changeVolumeTransition = (target: string) => ({
  CHANGE_VOLUME: {
    target,
    actions: 'changeVolume',
  },
});

const audioMachine = Machine<IContext>({
  id: 'audio',
  initial: 'loading',
  context: {
    audioRef: null,
    currentTrack: playlist[0],
    volume: 0.7,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          target: 'paused',
          actions: 'setAudioRef',
        },
        FAIL: 'failure',
      },
    },
    paused: {
      on: {
        PLAY: {
          target: 'playing',
          actions: 'play',
        },
        FAIL: 'failure',
        ...getPlaylistTransitions('paused'),
        ...changeVolumeTransition('paused'),
      },
    },
    playing: {
      on: {
        PAUSE: {
          target: 'paused',
          actions: 'pause',
        },
        FAIL: 'failure',
        ...getPlaylistTransitions('playing'),
        ...changeVolumeTransition('playing'),
      },
    },
    failure: {
      on: {
        RETRY: {
          target: 'loading',
          actions: ['setAudioRef', 'load'],
        },
        ...getPlaylistTransitions('loading'),
      },
    },
  },
});

const setAudioRef = assign({
  audioRef: (_, event: any) => event.audioRef,
});

const play = (context: IContext) => {
  context.audioRef?.play();
};

const pause = (context: IContext) => {
  context.audioRef?.pause();
};

const load = (context: IContext) => {
  context.audioRef?.load();
};

const changeVolume = assign(({ audioRef }: IContext, { volume }: any) => {
  if (audioRef) {
    audioRef.volume = volume;
  }
  return {
    volume,
  };
});

const nextTrack = assign(({ currentTrack }: IContext) => {
  const { id: trackId } = currentTrack;
  const { length } = playlist;
  const newTrack = trackId < length - 1 ? playlist[trackId + 1] : currentTrack;
  return {
    currentTrack: newTrack,
  };
});

const prevTrack = assign(({ currentTrack }: IContext) => {
  const { id: trackId } = currentTrack;
  const newTrack = trackId > 0 ? playlist[trackId - 1] : currentTrack;
  return {
    currentTrack: newTrack,
  };
});

const Player = () => {
  const [state, send] = useMachine(audioMachine, {
    actions: { setAudioRef, play, pause, load, nextTrack, prevTrack, changeVolume },
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  console.log('value: ', state.value);
  console.log(state.context);

  useEffect(() => {
    if (state.value !== 'failure') return;

    const id = setTimeout(() => {
      send('RETRY', { audioRef: audioRef.current });
    }, 3000);

    return () => clearTimeout(id);
  }, [state.value, send]);

  return (
    <>
      <audio
        src={state.context.currentTrack.url}
        ref={audioRef}
        onCanPlay={() => send('LOADED', { audioRef: audioRef.current })}
        autoPlay={state.matches('playing')}
        onError={() => {
          console.log('error');
          send('FAIL');
        }}
      />
      {state.matches('playing') ? (
        <button onClick={() => send('PAUSE')}>pause</button>
      ) : (
        <button onClick={() => send('PLAY')}>play</button>
      )}
      <h2>{state.context.currentTrack.name}</h2>
      <p>{state.context.currentTrack.title}</p>
      <button onClick={() => send('PREV_TRACK')}>prev</button>
      <button onClick={() => send('NEXT_TRACK')}>next</button>
      {state.matches('failure') && <p>что-то пошло не так</p>}
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={state.context.volume}
        onChange={(event) => send('CHANGE_VOLUME', { volume: parseFloat(event.target.value) })}
      />
    </>
  );
};

export default Player;
