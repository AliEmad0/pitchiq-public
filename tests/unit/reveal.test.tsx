import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RevealController } from "@/components/RevealController";
import {
  REVEAL_DONE_ATTR,
  REVEAL_GATE_SCRIPT,
  REVEAL_LIVE_ATTR,
  REVEAL_READY_ATTR,
  REVEAL_TARGET_ATTR,
  revealProps,
} from "@/utils/reveal";

class MockIO {
  static instances: MockIO[] = [];
  observed: Element[] = [];
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
    MockIO.instances.push(this);
  }

  observe(el: Element) {
    this.observed.push(el);
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el);
  }

  disconnect() {
    this.observed = [];
  }

  enter(el: Element) {
    this.callback(
      [{ target: el, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function addTarget(): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute(REVEAL_TARGET_ATTR, "");
  document.body.appendChild(el);
  return el;
}

describe("revealProps", () => {
  it("marks the element and omits style at index 0", () => {
    expect(revealProps()).toEqual({ "data-reveal": "" });
    expect(revealProps(0)).toEqual({ "data-reveal": "" });
  });

  it("carries the stagger index as --rvi for index > 0", () => {
    expect(revealProps(3)).toEqual({ "data-reveal": "", style: { "--rvi": 3 } });
  });
});

describe("REVEAL_GATE_SCRIPT", () => {
  it("stamps the ready attr only behind the IO + reduced-motion guards", () => {
    expect(REVEAL_GATE_SCRIPT).toContain(REVEAL_READY_ATTR);
    expect(REVEAL_GATE_SCRIPT).toContain("prefers-reduced-motion: reduce");
    expect(REVEAL_GATE_SCRIPT).toContain("IntersectionObserver");
  });
});

describe("RevealController / useReveal", () => {
  const root = document.documentElement;

  beforeEach(() => {
    MockIO.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIO);
    root.setAttribute(REVEAL_READY_ATTR, "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    root.removeAttribute(REVEAL_READY_ATTR);
    root.removeAttribute(REVEAL_LIVE_ATTR);
    root.classList.remove("boot-lock");
    document.body.innerHTML = "";
  });

  it("renders nothing", () => {
    const { container } = render(<RevealController />);
    expect(container).toBeEmptyDOMElement();
  });

  it("no-ops when the pre-paint gate did not stamp the ready attr", () => {
    root.removeAttribute(REVEAL_READY_ATTR);
    render(<RevealController />);
    expect(root.hasAttribute(REVEAL_LIVE_ATTR)).toBe(false);
    expect(MockIO.instances).toHaveLength(0);
  });

  it("stamps live, observes existing targets, and reveals them on intersect", () => {
    const el = addTarget();
    render(<RevealController />);

    expect(root.hasAttribute(REVEAL_LIVE_ATTR)).toBe(true);
    const io = MockIO.instances[0];
    expect(io.observed).toContain(el);

    io.enter(el);
    expect(el.hasAttribute(REVEAL_DONE_ATTR)).toBe(true);
    // Revealed once → unobserved (never replays).
    expect(io.observed).not.toContain(el);
  });

  it("observes content mounted after start (client nav / streamed / lazy)", async () => {
    render(<RevealController />);
    const io = MockIO.instances[0];

    const late = addTarget();
    const nested = document.createElement("section");
    const inner = document.createElement("article");
    inner.setAttribute(REVEAL_TARGET_ATTR, "");
    nested.appendChild(inner);
    document.body.appendChild(nested);

    await waitFor(() => {
      expect(io.observed).toContain(late);
      expect(io.observed).toContain(inner);
    });
  });

  it("defers starting while the TASK-1702 boot lock is on, starts when it clears", async () => {
    root.classList.add("boot-lock");
    const el = addTarget();
    render(<RevealController />);

    // Live is stamped immediately (disarms the CSS failsafe) but the observer
    // must not start while the boot loader is playing.
    expect(root.hasAttribute(REVEAL_LIVE_ATTR)).toBe(true);
    expect(MockIO.instances).toHaveLength(0);

    root.classList.remove("boot-lock");
    await waitFor(() => {
      expect(MockIO.instances).toHaveLength(1);
      expect(MockIO.instances[0].observed).toContain(el);
    });
  });

  it("cleans up on unmount (live attr removed)", () => {
    const { unmount } = render(<RevealController />);
    expect(root.hasAttribute(REVEAL_LIVE_ATTR)).toBe(true);
    unmount();
    expect(root.hasAttribute(REVEAL_LIVE_ATTR)).toBe(false);
  });
});
