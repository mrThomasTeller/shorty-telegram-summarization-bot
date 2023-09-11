export function catchError(promise: Promise<unknown> | undefined): void {
  promise?.catch((error) => {
    console.error(error);
  });
}
