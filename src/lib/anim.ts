/** アニメーション用の小さな数値ユーティリティ */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** t が a→b を進む間に 0→1 になる（範囲外はクランプ） */
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))

export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

export const lerp = (a: number, b: number, x: number) => a + (b - a) * x

/** t が a→b を進む間に from→to を ease 付きで補間 */
export const tween = (t: number, a: number, b: number, from: number, to: number) =>
  lerp(from, to, easeInOut(ramp(t, a, b)))

/** t が [a, b) にあるか */
export const within = (t: number, a: number, b: number) => t >= a && t < b

/** a でフェードイン、b でフェードアウトする不透明度（d はフェード時間） */
export const fade = (t: number, a: number, b: number, d = 0.4) => Math.min(ramp(t, a, a + d), 1 - ramp(t, b - d, b))

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
