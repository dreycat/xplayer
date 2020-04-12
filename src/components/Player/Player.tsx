import React, { useRef, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';

import playlist from './playlist';
import { ITrack } from './interfaces';

type TContext = {
  audioEl: HTMLAudioElement | null;
  currentTrack: ITrack;
  volume: number;
};

type TStates = {
  loading: {};
  paused: {};
  playing: {};
  ended: {};
  failure: {};
};

type TStateSchema = {
  states: TStates;
};

type TEvent =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'END' }
  | { type: 'FAIL' }
  | { type: 'PREV_TRACK' }
  | { type: 'NEXT_TRACK' }
  | { type: 'CHANGE_TRACK'; id: number }
  | { type: 'CHANGE_VOLUME'; volume: number }
  | { type: 'LOADED'; audioEl: HTMLAudioElement | null }
  | { type: 'RETRY'; audioEl: HTMLAudioElement | null };

const getPlaylistTransitions = (target: keyof TStates) => ({
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

const changeVolumeTransition = (target: keyof TStates) => ({
  CHANGE_VOLUME: {
    target,
    actions: 'changeVolume',
  },
});

const audioMachine = Machine<TContext, TStateSchema, TEvent>({
  id: 'audio',
  initial: 'loading',
  context: {
    audioEl: null,
    currentTrack: playlist[0],
    volume: 0.7,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          target: 'paused',
          actions: 'setAudioEl',
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
        END: 'ended',
        FAIL: 'failure',
        ...getPlaylistTransitions('playing'),
        ...changeVolumeTransition('playing'),
      },
    },
    ended: {
      on: {
        PLAY: {
          target: 'playing',
          actions: 'play',
        },
        FAIL: 'failure',
        ...getPlaylistTransitions('playing'),
        ...changeVolumeTransition('ended'),
      },
    },
    failure: {
      on: {
        RETRY: {
          target: 'loading',
          actions: ['setAudioEl', 'load'],
        },
        ...getPlaylistTransitions('loading'),
      },
    },
  },
});

const setAudioEl = assign({
  audioEl: (_, event: any) => event.audioEl,
});

const play = (context: TContext) => {
  context.audioEl?.play()?.catch(console.error);
};

const pause = (context: TContext) => {
  context.audioEl?.pause();
};

const load = (context: TContext) => {
  context.audioEl?.load();
};

const changeVolume = assign(({ audioEl }: TContext, { volume }: any) => {
  if (audioEl) {
    audioEl.volume = volume;
  }
  return {
    volume,
  };
});

const nextTrack = assign(({ currentTrack }: TContext) => {
  const { id: trackId } = currentTrack;
  const { length } = playlist;
  const newTrack = trackId < length - 1 ? playlist[trackId + 1] : currentTrack;
  return {
    currentTrack: newTrack,
  };
});

const prevTrack = assign(({ currentTrack }: TContext) => {
  const { id: trackId } = currentTrack;
  const newTrack = trackId > 0 ? playlist[trackId - 1] : currentTrack;
  return {
    currentTrack: newTrack,
  };
});

const changeTrack = assign(({ currentTrack }: TContext, { id: idx }: any) => {
  const newTrack = playlist.find(({ id }) => id === idx) ?? currentTrack;
  return {
    currentTrack: newTrack,
  };
});

const Player = () => {
  const [state, send] = useMachine(audioMachine, {
    actions: { setAudioEl, play, pause, load, nextTrack, prevTrack, changeVolume, changeTrack },
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);

  console.log('value: ', state.value);
  // console.log(state.context);

  useEffect(() => {
    if (state.value !== 'failure') return;

    const id = setTimeout(() => {
      send({ type: 'RETRY', audioEl: audioRef.current });
    }, 3000);

    return () => clearTimeout(id);
  }, [state.value, send]);

  return (
    <>
      <audio
        ref={audioRef}
        src={state.context.currentTrack.url}
        onEnded={() => send('END')}
        onError={() => send('FAIL')}
        autoPlay={state.matches('playing')}
        onCanPlay={() => send({ type: 'LOADED', audioEl: audioRef.current })}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
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

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={state.context.volume}
        onChange={(event) => send({ type: 'CHANGE_VOLUME', volume: parseFloat(event.target.value) })}
      />

      <ul>
        {playlist.map(({ id, name }) => (
          <li key={id} onClick={() => send({ type: 'CHANGE_TRACK', id })}>
            {name}
          </li>
        ))}
      </ul>
      {<span>{time}</span>}
      {state.matches('failure') && <p>что-то пошло не так</p>}
    </>
  );
};

export default Player;
