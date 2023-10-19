// Experiment with using program as class and not object
// As inspiration comes from F#, a functional lanuage, the concepts work better with functions
// So this is to see if it works better in the JS way with classes
// Question: Should progam be extended by user code by inheritance or by composition?

import { Command } from '../index.js';
import {
  InitializeFunction,
  SubscribeFunction,
  Termination,
  UpdateFunction,
} from '../program.js';
import { ActiveSubscription } from '../subscription.js';

// e.g. should the user code extend the program class or should the user code create a new class that contains the program class?
abstract class Program<TModel, TMessage, TArgument> {
  #messageQueue: TMessage[] = [];
  #isProcessingMessages: boolean = false;
  #isTerminated: boolean = false;

  abstract get update(): UpdateFunction<TModel, TMessage>;

  abstract get initialize(): InitializeFunction<TArgument, TModel, TMessage>;
  abstract get subscribe(): SubscribeFunction<TModel, TMessage>;
  abstract get terminate(): Termination<TMessage, TModel>;

  processMessages() {
    // Need to check length in case value of message is undefined
    const lengthBefore = this.#messageQueue.length;
    let nextMessage = this.#messageQueue.shift();

    while (
      !this.#isTerminated &&
      (nextMessage !== undefined || lengthBefore === 0)
    ) {}
  }

  run(argument: TArgument) {
    const [initialModel, command] = this.initialize(argument);
    const initialSubscriptions = this.subscribe(initialModel);
    const [isTerminationRequested, terminate] = this.terminate;

    let activeSubscriptions: ActiveSubscription[] = [];
    let currentState: TModel = initialModel;

    const messageQueue: TMessage[] = [];

    let isProcessingMessages = false;
    let isTerminated = false;
  }
}

// const app = new Program();
// // Gets the function and calls it but looks just like a function call
// app.update(undefined, undefined);
