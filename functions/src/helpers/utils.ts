/**
 * Delays execution for the specified number of milliseconds.
 * @param {number} ms The number of milliseconds to delay.
 * @return {Promise} A Promise that resolves after the specified delay.
 */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks a condition periodically until it's met or timeout occurs.
 * @param {function(): Promise<boolean>} conditionIsMet Function that returns a
 * promise resolving to a boolean.
 * @param {number} [timeout=5000] Maximum time to wait in milliseconds.
 * @return {Promise<boolean>} Promise resolving to true if timed out, false
 * if condition met.
 */
export function conditionCheck(
  conditionIsMet: () => Promise<boolean>,
  timeout = 5000
) {
  return new Promise((resolve) => {
    // For instance, check every 100ms
    let currentInterval = 0;
    const intervalId = setInterval(async () => {
      if (currentInterval + 100 >= timeout) {
        clearInterval(intervalId);
        resolve(true);
      }
      if (await conditionIsMet()) {
        clearInterval(intervalId);
        resolve(false);
      }
      currentInterval += 100;
    }, 100);
  });
}
