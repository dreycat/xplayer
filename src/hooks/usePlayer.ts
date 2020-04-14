import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';

import { ITrack } from '../components/Player/interfaces';
import playlist from '../components/Player/playlist';

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
  | { type: 'SET_CURRENT_TIME'; currentTime: number }
  | { type: 'LOADED'; audioEl: HTMLAudioElement | null }
  | { type: 'RETRY'; audioEl: HTMLAudioElement | null };

const getPlaylistTransitions = (target: keyof TStates) => ({
  PREV_TRACK: {
    target,
    actions: target === 'playing' ? ['prevTrack', 'play'] : 'prevTrack',
  },
  NEXT_TRACK: {
    target,
    actions: target === 'playing' ? ['nextTrack', 'play'] : 'nextTrack',
  },
  CHANGE_TRACK: {
    target,
    actions: target === 'playing' ? ['changeTrack', 'play'] : 'changeTrack',
  },
});

const changeVolumeTransition = (target: keyof TStates) => ({
  CHANGE_VOLUME: {
    target,
    actions: 'changeVolume',
  },
});

const setCurrentTimeTransition = (target: keyof TStates) => ({
  SET_CURRENT_TIME: {
    target,
    actions: 'setCurrentTime',
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
        ...setCurrentTimeTransition('paused'),
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
        ...setCurrentTimeTransition('playing'),
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
        ...setCurrentTimeTransition('paused'),
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

const setCurrentTime = ({ audioEl }: TContext, { currentTime }: any) => {
  if (audioEl && currentTime !== Infinity && !isNaN(currentTime)) {
    audioEl.currentTime = currentTime;
  }
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

export const usePlayer = () => {
  const ref = useRef<HTMLAudioElement>(null);
  const [state, send] = useMachine(audioMachine, {
    actions: { setAudioEl, play, pause, load, nextTrack, prevTrack, changeVolume, changeTrack, setCurrentTime },
  });
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const trackId = state.context.currentTrack.id;
  const isError = useMemo(() => state.matches('failure'), [state]);
  const isPlaying = useMemo(() => state.matches('playing'), [state]);
  const onEnded = useCallback(() => send('END'), [send]);
  const onError = useCallback(() => send('FAIL'), [send]);
  const onRetry = useCallback(() => send({ type: 'RETRY', audioEl: ref.current }), [send, ref]);
  const onLoaded = useCallback(() => send({ type: 'LOADED', audioEl: ref.current }), [send, ref]);

  const audio = useMemo(() => {
    const src = playlist.find(({ id }) => id === trackId)?.url ?? playlist[0].url;
    return React.createElement('audio', {
      ref,
      src,
      onError,
      onEnded,
      onCanPlay: onLoaded,
      autoPlay: isPlaying,
      controls: false,
      preload: 'metadata',
      onTimeUpdate: () => setTime(ref.current?.currentTime ?? 0),
      onDurationChange: () => setDuration(ref.current?.duration ?? 0),
    });
  }, [trackId, onEnded, onError, isPlaying, onLoaded]);

  useEffect(() => {
    if (!isError) return;

    const id = setTimeout(() => {
      onRetry();
    }, 3000);

    return () => clearTimeout(id);
  }, [isError, onRetry]);

  return {
    audio,
    state: {
      duration,
      currentTime: time,
      isPlaying,
      isError,
      isPaused: state.matches('paused'),
      isEnded: state.matches('ended'),
      isLoading: state.matches('loading'),
      isRadio: state.context.currentTrack.isRadio,
      currentTrack: state.context.currentTrack,
      volume: state.context.volume,
    },
    controlles: {
      onEnded,
      onError,
      onLoaded,
      onRetry,
      play: () => send('PLAY'),
      pause: () => send('PAUSE'),
      nextTrack: () => send('NEXT_TRACK'),
      prevTrack: () => send('PREV_TRACK'),
      changeTrack: (id: number) => send({ type: 'CHANGE_TRACK', id }),
      changeVolume: (volume: number) => send({ type: 'CHANGE_VOLUME', volume }),
      seek: (currentTime: number) => send({ type: 'SET_CURRENT_TIME', currentTime }),
    },
  };
};
