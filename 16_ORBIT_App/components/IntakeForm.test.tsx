/**
 * @vitest-environment jsdom
 *
 * Regression test for the "Charger l'exemple de homepage" button.
 *
 * Root cause investigated: empirical testing (dev + production build,
 * headless Chromium) showed the handler was actually wired correctly
 * (`onClick={() => setInput(SAMPLE)}`) and did populate every field. What
 * was missing was everything the acceptance criteria require around it: no
 * loading/disabled state, no guard against a second click re-entering while
 * a load is "in flight", and no error path at all — a failure would only
 * ever have surfaced as an uncaught rejection. This test locks in the
 * hardened behavior added in lib/homepageExample.ts + IntakeForm.tsx.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import IntakeForm from "./IntakeForm";
import { HOMEPAGE_EXAMPLE_BRIEF } from "@/lib/homepageExample";
import * as homepageExample from "@/lib/homepageExample";

describe("IntakeForm — Charger l'exemple de homepage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function nameInput() {
    return screen.getByPlaceholderText(/Campagne de lancement/i) as HTMLInputElement;
  }

  it("loads the homepage example into the form on click", async () => {
    const user = userEvent.setup();
    render(<IntakeForm />);

    expect(nameInput().value).toBe("");

    await user.click(screen.getByRole("button", { name: /Charger l.exemple de homepage/i }));

    await waitFor(() => expect(nameInput().value).toBe(HOMEPAGE_EXAMPLE_BRIEF.name));
    expect(screen.getByDisplayValue(HOMEPAGE_EXAMPLE_BRIEF.projectGoal)).toBeInTheDocument();
  });

  it("shows a loading state while the example is loading, and disables the button", async () => {
    let resolveLoad!: (value: typeof HOMEPAGE_EXAMPLE_BRIEF) => void;
    vi.spyOn(homepageExample, "loadHomepageExampleBrief").mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    const user = userEvent.setup();
    render(<IntakeForm />);

    const button = screen.getByRole("button", { name: /Charger l.exemple de homepage/i });
    await user.click(button);

    expect(await screen.findByRole("button", { name: /Chargement/i })).toBeDisabled();

    resolveLoad({ ...HOMEPAGE_EXAMPLE_BRIEF });
    await waitFor(() => expect(nameInput().value).toBe(HOMEPAGE_EXAMPLE_BRIEF.name));
  });

  it("double-clicking while a load is in flight only loads the example once", async () => {
    let resolveLoad!: (value: typeof HOMEPAGE_EXAMPLE_BRIEF) => void;
    const spy = vi.spyOn(homepageExample, "loadHomepageExampleBrief").mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    const user = userEvent.setup();
    render(<IntakeForm />);

    const button = screen.getByRole("button", { name: /Charger l.exemple de homepage/i });
    await user.click(button);
    // Button is now disabled/in a loading state; a second click must be a no-op
    // both at the UI level (disabled) and via the in-code re-entrancy guard.
    await user.click(button);
    await user.click(button);

    resolveLoad({ ...HOMEPAGE_EXAMPLE_BRIEF });
    await waitFor(() => expect(nameInput().value).toBe(HOMEPAGE_EXAMPLE_BRIEF.name));

    expect(spy).toHaveBeenCalledTimes(1);
    // The field holds exactly the example value once — not concatenated/duplicated.
    expect(nameInput().value.split(HOMEPAGE_EXAMPLE_BRIEF.name).length - 1).toBe(1);
  });

  it("shows visible error feedback when loading the example fails", async () => {
    vi.spyOn(homepageExample, "loadHomepageExampleBrief").mockRejectedValue(new Error("Exemple de homepage introuvable."));

    const user = userEvent.setup();
    render(<IntakeForm />);

    await user.click(screen.getByRole("button", { name: /Charger l.exemple de homepage/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Exemple de homepage introuvable/i);
    // Form stays empty — failed load must not silently apply partial data.
    expect(nameInput().value).toBe("");
  });
});
