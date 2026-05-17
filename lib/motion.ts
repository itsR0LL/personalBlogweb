import type { Transition, Variants } from "framer-motion";

const standardEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const emphasizedEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const motionDuration = {
  micro: 0.18,
  fast: 0.24,
  base: 0.36,
  slow: 0.52,
  reveal: 0.82,
  gallery: 0.86,
  article: 0.72,
  breath: 1.8,
  page: 0.66,
} as const;

export const motionEase = {
  standard: standardEase,
  emphasized: emphasizedEase,
} as const;

export const motionSpring = {
  snappy: { type: "spring", stiffness: 320, damping: 34, mass: 0.82 },
  gentle: { type: "spring", stiffness: 145, damping: 24, mass: 1 },
} satisfies Record<string, Transition>;

export const motionTransition = {
  micro: { duration: motionDuration.micro, ease: motionEase.standard },
  fast: { duration: motionDuration.fast, ease: motionEase.standard },
  base: { duration: motionDuration.base, ease: motionEase.standard },
  slow: { duration: motionDuration.slow, ease: motionEase.emphasized },
  reveal: { duration: motionDuration.reveal, ease: motionEase.standard },
  gallery: { duration: motionDuration.gallery, ease: motionEase.standard },
  article: { duration: motionDuration.article, ease: motionEase.standard },
  breath: { duration: motionDuration.breath, ease: motionEase.standard },
  page: { duration: motionDuration.page, ease: motionEase.emphasized },
  reduced: { duration: 0.16, ease: "linear" },
} satisfies Record<string, Transition>;

export const pageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} satisfies Variants;

export const reducedPageTransitionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} satisfies Variants;

export const motionVariants = {
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  modalPanel: {
    initial: { opacity: 0, y: 18, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 12, scale: 0.98 },
  },
  popover: {
    initial: { opacity: 0, y: -8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.98 },
  },
  listContainer: {
    initial: {},
    animate: { transition: { staggerChildren: 0.07 } },
  },
  listItem: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98 },
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  slideUp: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
} satisfies Record<string, Variants>;
