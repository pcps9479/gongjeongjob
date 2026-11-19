/**
 * `npx expo export --platform web` 결과물을 GitHub Pages에 바로 올릴 수 있게 마무리한다.
 *
 * - dist/.nojekyll : GitHub Pages의 Jekyll 처리를 끄고 `_expo/` 폴더를 그대로 서빙
 * - dist/404.html  : 하위 경로로 바로 접근해도 앱(index.html)으로 진입
 * - 빌드 결과에 서브패스(baseUrl)가 제대로 박혔는지 확인
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const baseUrl = appJson.expo?.experiments?.baseUrl ?? '';

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[postbuild] dist/index.html 이 없습니다. 먼저 `npx expo export --platform web` 을 실행하세요.');
  process.exit(1);
}

writeFileSync(join(dist, '.nojekyll'), '');
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));

const html = readFileSync(join(dist, 'index.html'), 'utf8');
const scriptSrc = html.match(/<script[^>]+src="([^"]+)"/)?.[1] ?? '';
const expected = baseUrl ? scriptSrc.startsWith(`${baseUrl}/`) : true;
const files = ['index.html', '404.html', '.nojekyll'];

console.log(`[postbuild] baseUrl: ${baseUrl || '(root)'}`);
console.log(`[postbuild] entry: ${scriptSrc}`);
console.log(`[postbuild] files: ${files.join(', ')}`);
if (!expected) {
  console.error('[postbuild] index.html 의 스크립트 경로에 baseUrl 이 적용되지 않았습니다.');
  process.exit(1);
}
console.log('[postbuild] GitHub Pages 배포 준비 완료 → dist/ 폴더를 그대로 업로드하세요.');
