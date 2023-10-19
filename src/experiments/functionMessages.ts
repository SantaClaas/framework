// import command, { Command } from "./framework/elmish/command";
// import { SignInModel } from "./signIn";

import { Command } from '../command.js';

//TODO experiment with making command a class with static methods to create it from various sources like promises
//TODO we need a construct to pass the function and its arguments that make a message. The function itself is only the
// "message type"
/**
 * A message is a function that accepts a model and optional arguments and returns a tuple of the model and command.
 * Similar to Function.apply
 */
type Message<TModel, TPayload extends any[]> = (
  model: TModel,
  ...payload: TPayload
) => [TModel, Command<Message<TModel, TPayload>>];

// // Based on Function.apply
// // function dispatch1<
// //   TModel,
// //   TMessage,
// //   TArguments extends any[],
// //   TReturn extends [TModel, Command<TMessage>]
// // >(
// //   message: (model: TModel, ...args: TArguments) => TReturn,
// //   ...args: TArguments
// // ): void {}

// function dispatch<TModel, TPayload extends any[]>(
//   message: Message<TModel, TPayload>,
//   ...payload: TPayload
// ): void {}

// type SignInMessage = typeof setUsername | typeof setPassword;

// function setUsername(
//   model: SignInModel,
//   name: string
// ): [SignInModel, Command<SignInMessage>] {
//   if (model.type !== "connected") return [model, command.none];

//   return [{ ...model, username: name }, command.none];
// }

// function setPassword(
//   model: SignInModel,
//   password: string
// ): [SignInModel, Command<SignInMessage>] {
//   return [model, command.none];
// }

// // Assigning to variable just to proof the type works
// const message1: Message<SignInModel, [string]> = setUsername;
// const message1AsSpecific: SignInMessage = message1;

// dispatch(message1, "name@example.com");

// const message2: Message<SignInModel, [string]> = setPassword;

// dispatch(message2, "P4$$w0rd");
