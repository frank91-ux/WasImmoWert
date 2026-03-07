/* ─── Framer Motion Animation Variants ─── */
import type { Variants, Transition } from 'framer-motion'

// Respect reduced motion preference
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

const duration = prefersReducedMotion ? 0 : undefined

/* ─── Page Transition ─── */
export const pageTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
  ...(duration !== undefined && { duration }),
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

/* ─── Fade In Up ─── */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

/* ─── Stagger Container ─── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.06,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
}

/* ─── Scale In ─── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: prefersReducedMotion ? 0 : 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

/* ─── Slide In Left ─── */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' },
  },
}

/* ─── Card Hover ─── */
export const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  hover: {
    y: prefersReducedMotion ? 0 : -2,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

/* ─── Stagger Item (generic child) ─── */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}
