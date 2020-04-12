import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';
import { ITrack } from '../Player/interfaces';
import playlist from '../Player/playlist';

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
  return useMachine(audioMachine, {
    actions: { setAudioEl, play, pause, load, nextTrack, prevTrack, changeVolume, changeTrack, setCurrentTime },
  });
};
