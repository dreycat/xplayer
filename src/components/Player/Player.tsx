import React, { useRef, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { Machine, assign } from 'xstate';

const audioMachine = Machine({
  id: 'audio',
  initial: 'loading',
  context: {
    audioRef: null,
  },
  states: {
    loading: {
      on: {
        LOADED: {
          target: 'prepared',
          actions: 'setAudioRef',
        },
        FAIL: 'failure',
      },
    },
    prepared: {
      initial: 'paused',
      states: {
        paused: {
          on: {
            PLAY: {
              target: 'playing',
              actions: 'play',
            },
          },
        },
        playing: {
          on: {
            PAUSE: {
              target: 'paused',
              actions: 'pause',
            },
            FAIL: '#audio.failure',
          },
        },
      },
    },
    failure: {
      on: {
        RETRY: {
          target: 'loading',
          actions: ['setAudioRef', 'load'],
        },
      },
    },
  },
});

const setAudioRef = assign({
  audioRef: (_, event: any) => event.audioRef,
});

const play = (context: any, _: any) => {
  context.audioRef?.play();
};

const pause = (context: any, _: any) => {
  context.audioRef?.pause();
};

const load = (context: any, _: any) => {
  context.audioRef?.load();
};

const Player = () => {
  const [state, send] = useMachine(audioMachine, { actions: { setAudioRef, play, pause, load } });
  const audioRef = useRef<HTMLAudioElement>(null);

  console.log('value: ', state.value);
  // console.log(state.context);

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
        src="http://ice6.somafm.com/groovesalad-256-mp3"
        ref={audioRef}
        onCanPlay={() => send('LOADED', { audioRef: audioRef.current })}
        onError={() => {
          console.log('error');
          send('FAIL');
        }}
      />
      {state.matches({ prepared: 'playing' }) ? (
        <button onClick={() => send('PAUSE')}>pause</button>
      ) : (
        <button onClick={() => send('PLAY')}>play</button>
      )}
      {state.matches('failure') && <span>что-то пошло не так</span>}
    </>
  );
};

export default Player;
