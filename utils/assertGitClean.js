import $ from './command.js';

const defaultOptions = {
  prompt: false,
  choices: {},
};

export default async function assertGitClean (userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const gitIndexedContent = await $('git', ['diff', '--cached']);
  if (gitIndexedContent) {
    if (options.prompt) {
      const choices = ['y', 'n'].concat(Object.keys(options.choices));
      let choice = null;
      while (!choice) {
        choice = await question(
          `git index not clean, continue [${choices.join('')}] ? `,
          { choices }
        );
        if (!choices.includes(choice.toLowerCase())) {
          choice = null;
          console.log('available choices are', {
            ...options.choices,
            y: 'yes - continue',
            n: 'no - exit script',
          });
        }
      }
      if (choice.toLowerCase() === 'n') process.exit();
      return choice;
    }
    throw new Error('git index not clean.');
  }
}
