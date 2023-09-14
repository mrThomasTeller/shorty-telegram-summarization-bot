export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function catchError(promise: Promise<unknown> | undefined): void {
  promise?.catch((error) => {
    console.error(error);
  });
}
