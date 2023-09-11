import type Services from '../services/Services';

type EntryPoint = (services: Services) => void | Promise<void>;

export default EntryPoint;
