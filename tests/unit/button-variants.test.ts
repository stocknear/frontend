import { describe, expect, it } from "vitest";
import { buttonVariants } from "../../src/lib/components/shadcn/button/index.js";
import { cn } from "../../src/lib/utils";

// `cn` is twMerge, which treats `bg-x` and `<prefix>:bg-x` as separate merge groups. A
// theme-prefixed background baked into a variant therefore survives whatever the call
// site passes and silently wins in that theme — which is how ~266 buttons ended up
// painting #09090B instead of the background they authored. These assertions are the
// tripwire for reintroducing that.

const VARIANTS = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;

const backgrounds = (classes: string) =>
  classes.split(/\s+/).filter((c) => /(?:^|:)bg-/.test(c));

describe("buttonVariants", () => {
  it.each(VARIANTS)("%s carries no theme-prefixed background", (variant) => {
    const prefixed = backgrounds(buttonVariants({ variant })).filter((c) =>
      /^(?:dark|light):bg-/.test(c),
    );
    expect(prefixed).toEqual([]);
  });

  it("lets a call site's plain background win", () => {
    const resolved = cn(buttonVariants({ className: "bg-surface-page/60" }));
    expect(backgrounds(resolved)).toEqual(["bg-surface-page/60"]);
  });

  it("gives an unstyled button the card surface, so it matches a panel it sits in", () => {
    expect(backgrounds(buttonVariants({}))).toEqual(["bg-surface-card"]);
  });
});
