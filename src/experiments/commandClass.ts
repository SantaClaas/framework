// Proxy is cool but overkill https://stackoverflow.com/a/36871623

import { Dispatch, Effect } from '../command.js';

export class Command<TMessage> {
  #effects: Effect<TMessage>[];
  constructor(effects: Effect<TMessage>[]) {
    this.#effects = effects;
  }

  /**
   * Execute the commands using the supplied dispatcher
   * @internal
   */
  execute(onError: (error: unknown) => void, dispatch: Dispatch<TMessage>) {
    this.#effects.forEach(call => {
      try {
        call(dispatch);
      } catch (error: unknown) {
        onError(error);
      }
    });
  }

  static none: Command<never> = new Command([]);

  map<TMessageOther>(
    mapper: (message: TMessage) => TMessageOther,
  ): Command<TMessageOther> {
    return new Command(
      // Transform the message with the map function when the effect is called (this is somewhat of a mindbreaker)
      this.#effects.map(bind => (dispatch: Dispatch<TMessageOther>) => {
        bind(message => dispatch(mapper(message)));
      }),
    );
  }

  /**
   * Aggregate multiple commands
   */
  static batch<TMessage>(commands: Command<TMessage>[]): Command<TMessage> {
    return new Command(commands.map(command => command.#effects).flat());
  }

  /**
   * Command to call the effect
   */
  static ofEffect<TMessage>(effect: Effect<TMessage>): Command<TMessage> {
    return new Command([effect]);
  }

  /**
   * Command to directly issue a specific message
   */
  static ofMessage<TMessage>(message: TMessage): Command<TMessage> {
    return new Command([dispatch => dispatch(message)]);
  }

  static either<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => TResult | Promise<TResult>,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage,
    ofError: (error: unknown) => TMessage,
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        const result = task(argument);

        if (result instanceof Promise) {
          result.then(ofSuccess).catch(ofError).then(dispatch);
          return;
        }

        const message = ofSuccess(result);
        dispatch(message);
      } catch (error: unknown) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    return new Command([bind]);
  }

  static perform<TArgument, TResult, TMessage>(
    task: (argument: TArgument) => TResult | Promise<TResult>,
    argument: TArgument,
    ofSuccess: (result: TResult) => TMessage,
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        const result = task(argument);

        if (result instanceof Promise) {
          result.then(ofSuccess).then(dispatch);
          return;
        }

        const message = ofSuccess(result);
        dispatch(message);
      } catch (error: unknown) {
        // Ignore errors
      }
    }

    return new Command([bind]);
  }

  static attempt<TArgument, TMessage>(
    task: (argument: TArgument) => void,
    argument: TArgument,
    ofError: (error: unknown) => TMessage,
  ): Command<TMessage> {
    function bind(dispatch: Dispatch<TMessage>) {
      try {
        task(argument);
      } catch (error: unknown) {
        const message = ofError(error);
        dispatch(message);
      }
    }

    return new Command([bind]);
  }
}
