'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveGameAsset } = require('../protocol.cjs');

const root = path.resolve(__dirname, '../game');
const entry = path.join(root, 'index.html');
assert.equal(resolveGameAsset(root, 'everafter://game/index.html'), entry);
assert.equal(resolveGameAsset(root, 'everafter://game/'), entry);
assert.equal(resolveGameAsset(root, 'everafter://evil/index.html'), null);
assert.equal(resolveGameAsset(root, 'https://game/index.html'), null);
assert.equal(resolveGameAsset(root, 'file:///etc/passwd'), null);
assert.equal(resolveGameAsset(root, 'everafter://game/%GG'), null);
assert.equal(resolveGameAsset(root, 'everafter://game/avatars/../../index.html'), entry);
assert.equal(resolveGameAsset(root, 'everafter://game/assets/avatars/baby-01.svg'), path.join(root, 'assets', 'avatars', 'baby-01.svg'));
const content = fs.readFileSync(entry, 'utf8');
assert.ok(content.includes('EverAfter') || content.includes('Everafter'));
assert.ok(content.includes('localStorage'), 'Game must contain local persistence');
for (const name of ['assets/avatars/baby-01.svg', 'assets/stages/elder.svg',
  'assets/icons/relationships.svg', 'assets/brand/everafter-logo.svg',
  'assets/events/the-toy-incident.svg']) {
  assert.ok(fs.statSync(path.join(root, name)).size > 250, 'Missing packaged art: ' + name);
}
for (const name of ['main.cjs', 'protocol.cjs', 'scripts/make-icon.cjs', 'scripts/stage-game.cjs']) {
  const checked = spawnSync(process.execPath, ['--check', path.resolve(__dirname, '..', name)], { encoding: 'utf8' });
  assert.equal(checked.status, 0, name + ' syntax: ' + checked.stderr);
}
const appMain = fs.readFileSync(path.resolve(__dirname, '../main.cjs'), 'utf8');
for (const check of ['registerSchemesAsPrivileged', 'contextIsolation: true', 'nodeIntegration: false',
  'sandbox: true', 'setPermissionRequestHandler', "everafter://game/index.html",
  'will-download', 'showSaveDialogSync']) {
  assert.ok(appMain.includes(check), 'Electron safety/saving check missing: ' + check);
}
console.log('PASS: Desktop game is offline, art is present, stable save origin configured, safe Electron settings and JSON save export enabled.');
