// Wrapper do worker do pdf.js: instala os polyfills (navegadores antigos) e
// então carrega o worker oficial. Ver /pdf-worker-polyfills.js.
import "./pdf-worker-polyfills.js";
import "./pdf.worker.min.mjs";
