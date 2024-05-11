import type Services from '../services/Services';

type EntryPoint = (services: Services, ...params: (string | undefined)[]) => void | Promise<void>;

export default EntryPoint;
