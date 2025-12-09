/**
 * Svelte action for scroll-triggered animations
 * Usage: <div use:inview={{ animation: 'fade-up', delay: 100 }}>
 */

export interface InviewOptions {
  /** Animation type: 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'fade', 'scale', 'blur' */
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'fade' | 'scale' | 'blur';
  /** Delay in milliseconds before animation starts */
  delay?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
  /** Root margin for earlier/later triggering */
  rootMargin?: string;
  /** Whether to animate only once or every time element enters view */
  once?: boolean;
  /** Easing function */
  easing?: string;
}

const defaultOptions: InviewOptions = {
  animation: 'fade-up',
  delay: 0,
  duration: 600,
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
  once: true,
  easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
};

// Initial styles for each animation type
const initialStyles: Record<string, Record<string, string>> = {
  'fade-up': {
    opacity: '0',
    transform: 'translateY(30px)'
  },
  'fade-down': {
    opacity: '0',
    transform: 'translateY(-30px)'
  },
  'fade-left': {
    opacity: '0',
    transform: 'translateX(30px)'
  },
  'fade-right': {
    opacity: '0',
    transform: 'translateX(-30px)'
  },
  'fade': {
    opacity: '0'
  },
  'scale': {
    opacity: '0',
    transform: 'scale(0.95)'
  },
  'blur': {
    opacity: '0',
    filter: 'blur(10px)'
  }
};

// Final styles (visible state)
const finalStyles: Record<string, Record<string, string>> = {
  'fade-up': {
    opacity: '1',
    transform: 'translateY(0)'
  },
  'fade-down': {
    opacity: '1',
    transform: 'translateY(0)'
  },
  'fade-left': {
    opacity: '1',
    transform: 'translateX(0)'
  },
  'fade-right': {
    opacity: '1',
    transform: 'translateX(0)'
  },
  'fade': {
    opacity: '1'
  },
  'scale': {
    opacity: '1',
    transform: 'scale(1)'
  },
  'blur': {
    opacity: '1',
    filter: 'blur(0)'
  }
};

export function inview(node: HTMLElement, options: InviewOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  let observer: IntersectionObserver;
  let hasAnimated = false;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If reduced motion, show element immediately without animation
  if (prefersReducedMotion) {
    return { destroy() {} };
  }

  const animationType = opts.animation || 'fade-up';
  const initial = initialStyles[animationType];
  const final = finalStyles[animationType];

  // Apply initial hidden state
  Object.assign(node.style, initial);
  node.style.transition = 'none';
  node.style.willChange = 'opacity, transform, filter';

  const animate = () => {
    // Set transition
    node.style.transition = `
      opacity ${opts.duration}ms ${opts.easing},
      transform ${opts.duration}ms ${opts.easing},
      filter ${opts.duration}ms ${opts.easing}
    `.trim();

    // Apply delay if specified
    if (opts.delay && opts.delay > 0) {
      node.style.transitionDelay = `${opts.delay}ms`;
    }

    // Trigger animation
    requestAnimationFrame(() => {
      Object.assign(node.style, final);
    });

    // Clean up will-change after animation
    setTimeout(() => {
      node.style.willChange = 'auto';
    }, (opts.duration || 600) + (opts.delay || 0) + 100);
  };

  const handleIntersect = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (opts.once && hasAnimated) return;
        hasAnimated = true;
        animate();

        if (opts.once) {
          observer.unobserve(node);
        }
      } else if (!opts.once && hasAnimated) {
        // Reset for re-animation
        Object.assign(node.style, initial);
        hasAnimated = false;
      }
    });
  };

  // Create observer
  observer = new IntersectionObserver(handleIntersect, {
    threshold: opts.threshold,
    rootMargin: opts.rootMargin
  });

  observer.observe(node);

  return {
    update(newOptions: InviewOptions) {
      // Could implement update logic here if needed
    },
    destroy() {
      if (observer) {
        observer.disconnect();
      }
    }
  };
}

/**
 * Helper to create staggered delays for child elements
 * Usage: getStaggerDelay(index, 100) returns 0, 100, 200, 300...
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}
