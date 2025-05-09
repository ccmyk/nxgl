/* components/webgl/Tt.module.pcss */

/* Styles the <canvas> rendered by the Tt component */
.canvasElement {
  position: absolute; /* Centered within the parent .cCover */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; /* Canvas doesn't need interaction */
  /* Width/Height determined by renderer.setSize based on parent */
  max-width: 100%; /* Prevent overflow */
  max-height: 100%;
}
