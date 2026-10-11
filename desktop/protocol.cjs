'use strict';
const path = require('node:path');

function resolveGameAsset(root, requestUrl) {
  let url;
  try { url = new URL(requestUrl); } catch { return null; }
  if (url.protocol !== 'everafter:' || url.hostname !== 'game' || url.port || url.username || url.password) return null;
  let decoded;
  try { decoded = decodeURIComponent(url.pathname); } catch { return null; }
  if (!decoded.startsWith('/') || decoded.includes('\\0')) return null;
  const base = path.resolve(root);
  // The URL has a fixed host and never grants access outside the bundled game directory.
  const requested = path.resolve(base, '.' + decoded);
  if (requested !== base && !requested.startsWith(base + path.sep)) return null;
  return requested === base ? path.join(base, 'index.html') : requested;
}
module.exports = { resolveGameAsset };
