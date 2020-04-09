import React from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, interpret, assign } from 'xstate';

const fetchMachine = createMachine<any>({
  id: 'SWAPI',
  initial: 'idle',
  context: {
    todo: null,
  },
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      invoke: {
        id: 'fetchTodo',
        src: (context: any, event: any) =>
          fetch('https://jsonplaceholder.typicode.com/todos/1').then((data) => data.json()),
        onDone: {
          target: 'resolved',
          actions: assign({
            todo: (_, event) => event.data,
          }),
        },
        onError: 'rejected',
      },
      on: {
        CANCEL: 'idle',
      },
    },
    resolved: {
      type: 'final',
    },
    rejected: {
      on: {
        FETCH: 'loading',
      },
    },
  },
});

export const Toggler = () => {
  const [state, send] = useMachine(fetchMachine);

  console.log(state.value);
  console.log(state.context);

  return (
    <>
      {state.value === 'loading' && <span>loading</span>}
      {state.value === 'resolved' && <span>{state.context.todo.title}</span>}
      <button onClick={() => send('FETCH')}>fetch</button>
    </>
  );
};
