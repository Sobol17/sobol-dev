import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('build-demo');
const prefix = '/sobol-dev/';
const mime = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.woff2': 'font/woff2'
};

createServer(async (request, response) => {
	const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		response.writeHead(405).end();
		return;
	}
	if (pathname === prefix.slice(0, -1)) {
		response.writeHead(301, { location: prefix }).end();
		return;
	}
	if (!pathname.startsWith(prefix)) {
		response.writeHead(404).end();
		return;
	}
	let filename;
	try {
		filename = resolve(root, decodeURIComponent(pathname.slice(prefix.length)));
	} catch {
		response.writeHead(400).end();
		return;
	}
	if (filename !== root && !filename.startsWith(root + sep)) {
		response.writeHead(403).end();
		return;
	}
	try {
		if ((await stat(filename)).isDirectory()) {
			if (!pathname.endsWith('/')) {
				response.writeHead(301, { location: pathname + '/' }).end();
				return;
			}
			filename = resolve(filename, 'index.html');
		}
		const body = await readFile(filename);
		response.writeHead(200, {
			'Content-Type': mime[extname(filename)] ?? 'application/octet-stream'
		});
		response.end(request.method === 'HEAD' ? undefined : body);
	} catch {
		response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
		response.end(await readFile(resolve(root, '404.html')));
	}
}).listen(4176, '127.0.0.1', () => console.log('Demo: http://127.0.0.1:4176/sobol-dev/'));
