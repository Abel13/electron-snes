// React development tracks pass Fiber details to Performance.measure().
// Electron's Chromium cannot clone those details reliably, so disable only
// the optional tracks on the local development origin before React loads.
if (
  location.protocol === 'http:' &&
  location.hostname === '127.0.0.1' &&
  navigator.userAgent.includes('Electron')
) {
  Object.defineProperty(performance, 'measure', {
    configurable: true,
    value: undefined,
  });
}
