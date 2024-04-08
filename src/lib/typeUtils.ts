export type MaybePromise<T> = T | Promise<T>;
export type TOmit<T, K extends keyof T> = Omit<T, K>;
