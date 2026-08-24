import { type VariantProps, tv } from "tailwind-variants";
import type { Button as ButtonPrimitive } from "bits-ui";
import Root from "./button.svelte";

const buttonVariants = tv({
  base: " cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded text-sm  ring-offset-background  focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      // One theme-aware token, never a theme-prefixed background: twMerge keeps a
      // prefixed background against a caller's plain `bg-*`, so the variant used to
      // win in dark mode no matter what the call site authored.
      default: "bg-surface-card text-fg",
      destructive: "bg-destructive text-destructive-foreground",
      outline:
        "border border-input bg-background hover:bg-surface-raised hover:text-fg",
      secondary: "bg-secondary text-secondary-foreground",
      ghost: "hover:bg-surface-raised hover:text-fg",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-9 rounded px-3",
      lg: "h-11 rounded px-8",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type Variant = VariantProps<typeof buttonVariants>["variant"];
type Size = VariantProps<typeof buttonVariants>["size"];

type Props = ButtonPrimitive.Props & {
  variant?: Variant;
  size?: Size;
};

type Events = ButtonPrimitive.Events;

export {
  Root,
  type Props,
  type Events,
  //
  Root as Button,
  type Props as ButtonProps,
  type Events as ButtonEvents,
  buttonVariants,
};
