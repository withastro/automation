import nlp from 'compromise';

// @ts-check
/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export default function lint({ core, context, github }) {
    const pr = context.payload.pull_request
    console.log("Hello world!", { pr, nlp })
}
