// Experiment with using program as class and not object
// As inspiration comes from F#, a functional lanuage, the concepts work better with functions
// So this is to see if it works better in the JS way with classes
// Question: Should progam be extended by user code by inheritance or by composition?

import { Command } from './commandClass.js';
import { HandleErrorFunction } from '../error.js';
import { SubscribeFunction } from '../program.js';
import {
  ActiveSubscription,
  NewSubscription,
  change,
  differentiate,
  stopSubscriptions,
} from '../subscription.js';

export type UpdateFunction<TModel, TMessage> = (
  message: TMessage,
  model: TModel,
) => [TModel, Command<TMessage>];

export type InitializeFunction<TArgument, TModel, TMessage> = (
  argument: TArgument,
) => [TModel, Command<TMessage>];

// e.g. should the user code extend the program class or should the user code create a new class that contains the program class?
abstract class Program<TModel, TMessage, TArgument> {
  #messageQueue: TMessage[] = [];
  #isProcessingMessages: boolean = false;
  #isTerminated: boolean = false;
  #activeSubscriptions: ActiveSubscription[] = [];
  #state: TModel;
  constructor(state: TModel) {
    this.#state = state;
  }

  abstract get update(): UpdateFunction<TModel, TMessage>;

  abstract get initialize(): InitializeFunction<TArgument, TModel, TMessage>;
  abstract get subscribe(): SubscribeFunction<TModel, TMessage>;
  // abstract get terminate(): Termination<TMessage, TModel>;

  abstract isTerminationRequested(message: TMessage): boolean;
  abstract get onError(): HandleErrorFunction;

  /**
   * Called when the program is terminated. Can optionally be overridden to perform cleanup.
   */
  terminate(state: TModel): void {}

  abstract setState(state: TModel, dispatch: (message: TMessage) => void): void;

  // The dispatch function is how we hook into the loop
  // and provide users a way to update the state
  // to start processing messages if there are new one as long as we are not terminated
  #dispatch(message: TMessage) {
    // Don't add more messages to process and break loop
    if (this.#isTerminated) return;

    // Enqueue messages to be processed
    this.#messageQueue.push(message);

    // Start processing if it hasn't started yet
    if (this.#isProcessingMessages) return;

    this.#isProcessingMessages = true;
    this.#processMessages();
    this.#isProcessingMessages = false;
  }

  #processMessages() {
    let nextMessage = this.#messageQueue.shift();

    // Stop loop in case of termination or no more messages
    while (!this.#isTerminated && nextMessage !== undefined) {
      this.#isTerminated = this.isTerminationRequested(nextMessage);

      if (this.#isTerminated) {
        stopSubscriptions(this.onError, this.#activeSubscriptions);
        this.terminate(this.#state);

        // Break out of processing
        return;
      }

      // The update loop. It might add new messages to the message queue
      // when the dispatch callback is invoked.
      // We hand it the first message that is waiting in queue
      const [newState, newCommand] = this.update(nextMessage, this.#state);

      // Next we give the component the chance to start subscriptions based on the new state
      // Subscriptions have an id to avoid starting them again
      const subscriptions = this.subscribe(newState);
      // Inside the setState function the program or component can call the view function to render the UI
      this.setState(newState, this.#dispatch);

      // Execute commands
      newCommand.execute(
        error =>
          this.onError(`Error handling the message: ${nextMessage}`, error),
        this.#dispatch,
      );

      // Completed run, set new to current
      this.#state = newState;

      // Find subscriptions that need to be started and which ones need to be stopped
      const difference = differentiate<TMessage>(
        this.#activeSubscriptions,
        subscriptions,
      );

      // Stops no longer active subscriptions and starts not started ones
      this.#activeSubscriptions = change<TMessage>(
        this.onError,
        this.#dispatch,
        difference,
      );

      // Complete loop
      nextMessage = this.#messageQueue.shift();
    }
  }

  run(argument: TArgument) {
    // First start of the program loop
    this.#isProcessingMessages = true;

    const [initialModel, newCommand] = this.initialize(argument);
    const initialSubscriptions = this.subscribe(initialModel);
    this.#state = initialModel;

    // Set state normally triggers the first render here
    this.setState(this.#state, this.#dispatch);

    newCommand.execute(
      error => this.onError(`Error initialzing`, error),
      this.#dispatch,
    );

    const difference = differentiate<TMessage>(
      this.#activeSubscriptions,
      initialSubscriptions,
    );
    this.#activeSubscriptions = change(
      this.onError,
      this.#dispatch,
      difference,
    );
    this.#processMessages();
    this.#isProcessingMessages = false;
  }
}

//TODO experiment with making program and command emit events (extends EventTarget) and enable subscriptions to easily work with JS event handlers
