import { createServices } from './createServices';
import type EntryPoint from './entryPoints/EntryPoint';

const entryPointName = process.argv[2];

const entryPoint = (await import(`./entryPoints/${entryPointName}.ts`)) as {
  default: EntryPoint;
};

void entryPoint.default(createServices(), ...process.argv.slice(3));
