/** Animation values are normalized to the avatar bounds. Figma Warp defaults:
 * Sine wave, amplitude 3, scale 1, center 50/50. Its executable shader is not embedded. */
export const warpConfig = {
  amplitude: 0.12,
  staticDiagonalStretch: 0.76,
  speed: 1.4,
  deformationScale: 1,
  direction: -Math.PI / 4,
  transitionSmoothness: 2.4,
  directionInterval: [3, 3] as const,
};
export const glassConfig = {
  // Figma UI: Refraction 100, Depth 100, Dispersion 100, Frost 24, Splay 100.
  blur: 24, refractionRadius: 100, refractionIntensity: 1,
  depth: 100, dispersion: 100, splay: 100,
  specularAngle: -45, specularIntensity: 0.8, bevelSize: 1,
  chromaticAberration: 1, reflectionDistance: 1, fillOpacity: 0.33,
};
/** Empty URLs intentionally produce hover-only surfaces until real links are supplied. */
export const links = { telegram: 'https://t.me/deskum', instagram: '', sber: '', mentoring: '', experience: '', competition: '', research: 'https://t.me/deskum' };
