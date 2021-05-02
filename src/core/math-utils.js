export const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x

export const clamp = (x, min = 0, max = 1) => x < min ? min : x > max ? max : x

export const lerp = (a, b, t) => a + (b - a) * t

export const inverseLerp = (a, b, t) => (t - a) / (b - a)


