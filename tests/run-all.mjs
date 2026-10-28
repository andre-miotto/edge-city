// Roda os testes em sequência (o build já foi feito por "npm test").
import { execFileSync } from 'child_process';

let failed = 0;
for (const t of ['smoke', 'routes', 'camera']) {
  console.log('\n— ' + t);
  try {
    execFileSync(process.execPath, ['tests/' + t + '.mjs'], { stdio: 'inherit' });
  } catch {
    failed++;
  }
}
console.log(failed ? `\n${failed} teste(s) falharam` : '\nTodos os testes passaram');
process.exitCode = failed ? 1 : 0;
