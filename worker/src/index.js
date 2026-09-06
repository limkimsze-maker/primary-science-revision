// Compatibility entry point. The deployed Worker uses speech-and-process.js,
// which delegates /mark to process-hierarchy.js -> calibrated.js.
// Keep this file aligned by re-exporting the same calibrated marker.
export { default } from './calibrated.js';
