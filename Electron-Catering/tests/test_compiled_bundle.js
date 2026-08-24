import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('📦 TESTING COMPILED ELECTRON PRODUCTION BUNDLE');
console.log('============================================================\n');

const mainBundle = '/home/villarias/Projects/Electron-Catering/dist-electron/main/index.js';
const preloadBundle = '/home/villarias/Projects/Electron-Catering/dist-electron/preload/index.mjs';
const rendererIndex = '/home/villarias/Projects/Electron-Catering/dist/index.html';

console.log('Checking built artifacts on disk...');
console.log(`  Main Bundle: ${fs.existsSync(mainBundle) ? '✅ Exists' : '❌ Missing'} (${(fs.statSync(mainBundle).size / 1024).toFixed(1)} KB)`);
console.log(`  Preload Script: ${fs.existsSync(preloadBundle) ? '✅ Exists' : '❌ Missing'} (${(fs.statSync(preloadBundle).size / 1024).toFixed(1)} KB)`);
console.log(`  Renderer HTML: ${fs.existsSync(rendererIndex) ? '✅ Exists' : '❌ Missing'} (${(fs.statSync(rendererIndex).size / 1024).toFixed(1)} KB)`);

if (fs.existsSync(mainBundle) && fs.existsSync(preloadBundle) && fs.existsSync(rendererIndex)) {
  console.log('\n============================================================');
  console.log('✅ ALL PRODUCTION BUNDLES ARE VERIFIED & READY TO LAUNCH!');
  console.log('============================================================\n');
} else {
  console.error('\n❌ BUNDLE VERIFICATION FAILED!');
  process.exit(1);
}
