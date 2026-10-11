'use strict';
const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../../Everafter/Game');
const target = path.resolve(__dirname, '../game');
if (!fs.existsSync(path.join(source, 'index.html'))) {
  throw new Error('Missing shared EverAfter game: Everafter/Game/index.html');
}
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true, force: true });
const count = dir => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, entry) => n + (entry.isDirectory() ? count(path.join(dir, entry.name)) : entry.name.endsWith('.svg') ? 1 : 0), 0);
const assets = count(path.join(target, 'assets'));
if (assets < 187) throw new Error('The desktop app is missing offline art assets (' + assets + '/187).');
console.log('Staged EverAfter desktop game and ' + assets + ' offline illustrations.');
