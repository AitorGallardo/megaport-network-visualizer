<script setup lang="ts">
// Aceternity-style "grid and dot" background.
// Exact recipe: a dot grid (radial-gradient tile) layered over a faint line grid,
// with a radial mask that fades the pattern out toward the edges, on the canvas.
</script>

<template>
  <div class="add-bg" aria-hidden="true">
    <div class="dot-layer"></div>
    <div class="grid-layer"></div>
  </div>
</template>

<style scoped>
/* Base canvas */
.add-bg { position: absolute; inset: 0; overflow: hidden; background: #151515; pointer-events: none; }

/* Dot grid — the primary Aceternity pattern */
.dot-layer {
  position: absolute; inset: 0;
  background-image: radial-gradient(#3f403d 1px, transparent 1px);
  background-size: 20px 20px;
  /* fade the dots out at the edges, brightest in the centre */
  -webkit-mask-image: radial-gradient(ellipse at center, black 10%, transparent 75%);
  mask-image: radial-gradient(ellipse at center, black 10%, transparent 75%);
}

/* Subtle line grid underneath, for the "grid + dots" combined look */
.grid-layer {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(to right, rgba(63,64,61,0.35) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(63,64,61,0.35) 1px, transparent 1px);
  background-size: 40px 40px;
  -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
}
</style>
