import { createServices } from './createServices.ts';
import type EntryPoint from './entryPoints/EntryPoint.ts';

const entryPointName = process.argv[2];

const entryPoint = (await import(`./entryPoints/${entryPointName}.ts`)) as {
  default: EntryPoint;
};

void entryPoint.default(createServices(), ...process.argv.slice(3));
