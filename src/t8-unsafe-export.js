// T8 fixture for the DevDigest CI check. Do not merge.
import http from 'node:http';
import { exec } from 'node:child_process';

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = url.searchParams.get('file');
    exec(`cat notes/${file}`, (err, out) => res.end(err ? 'error' : out));
  })
  .listen(3000);
