export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startTracker } = await import("./lib/tracker");
    startTracker();
  }
}
