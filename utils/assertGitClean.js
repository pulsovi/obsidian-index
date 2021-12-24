import $ from './command.js';

export default async function assertGitClean () {
  const gitIndexedContent = await $('git', ['diff', '--cached']);
  if (gitIndexedContent)
    throw new Error('git index not clean.');
}
