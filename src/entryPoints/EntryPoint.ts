import type Services from '../services/Services';

type EntryPoint = (
  services: Services,
  ...params: (string | undefined)[]
) => undefined | Promise<void>;

export default EntryPoint;
