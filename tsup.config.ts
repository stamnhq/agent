import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'commands/start': 'src/commands/start.ts',
    'commands/stop': 'src/commands/stop.ts',
    'commands/status': 'src/commands/status.ts',
    'commands/config/index': 'src/commands/config/index.ts',
    'commands/config/set': 'src/commands/config/set.ts',
    'commands/config/get': 'src/commands/config/get.ts',
    'commands/spend': 'src/commands/spend.ts',
    'commands/update': 'src/commands/update.ts',
    'ui/setup': 'src/ui/setup.tsx',
  },
  format: ['esm'],
  target: 'node22',
  clean: true,
  sourcemap: true,
  dts: true,
  noExternal: ['@stamn/types'],
  splitting: true,
  define: {
    AGENT_VERSION: JSON.stringify(pkg.version),
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});
