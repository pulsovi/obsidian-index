import childProcess from 'child_process';

export default function command (...args) {
  const subProcess = childProcess.spawn(...args);
  let stdout = '';
  subProcess.stdout.setEncoding('utf8');
  subProcess.stdout.on('data', chunk => {
    // console.log(chunk);
    stdout += chunk;
  });
  return new Promise(rs => {
    subProcess.on('close', () => {
      rs(stdout);
    })
  })
}
