/**
 * @vitest-environment jsdom
 *
 * Regression test for "projects cannot be deleted": no delete affordance,
 * no confirmation, no cascade, no list refresh existed anywhere in the UI.
 * This covers the list page's delete flow: opening the confirmation dialog,
 * cancel leaving the project untouched, confirm deleting it and refreshing
 * the list without a page reload, a success toast appearing, and an API
 * failure surfacing a visible error instead of silently succeeding or
 * throwing uncaught.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/types";

vi.mock("@/lib/storage", () => ({
  listProjects: vi.fn(),
  deleteProject: vi.fn(),
}));

import ProjectsPage from "./page";
import { deleteProject, listProjects } from "@/lib/storage";

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "site-24march",
    name: "Site 24March Studio",
    type: "Site web",
    stage: "brief",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brief: {
      brandProfileId: "brand-24march",
      workflowType: "website",
      projectGoal: "",
      specificContext: "",
      deliverableType: "",
      references: "",
      constraints: "",
      channels: "",
      format: "Markdown",
      successCriteria: "",
    },
    outputs: {},
    reviews: [],
    exports: [],
    ...overrides,
  };
}

describe("ProjectsPage — delete a project", () => {
  beforeEach(() => {
    vi.mocked(listProjects).mockResolvedValue([makeProject()]);
    window.sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function renderLoaded() {
    render(<ProjectsPage />);
    await screen.findByText("Site 24March Studio");
  }

  it("opens a confirmation dialog stating the action is irreversible, and cancel leaves the project intact", async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: /Supprimer le projet "Site 24March Studio"/i }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/irréversible/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Annuler/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Site 24March Studio")).toBeInTheDocument();
    expect(deleteProject).not.toHaveBeenCalled();
  });

  it("confirming deletes the project, refreshes the list immediately, and shows a success toast", async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: /Supprimer le projet "Site 24March Studio"/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /Supprimer définitivement/i }));

    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith("site-24march"));
    await waitFor(() => expect(screen.queryByText("Site 24March Studio")).not.toBeInTheDocument());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    expect(await screen.findByRole("status")).toHaveTextContent(/supprimé/i);
  });

  it("shows a visible error and keeps the project in the list when the API call fails", async () => {
    vi.mocked(deleteProject).mockRejectedValue(new Error("La requête a échoué (503)"));
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByRole("button", { name: /Supprimer le projet "Site 24March Studio"/i }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /Supprimer définitivement/i }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/échoué/i);
    // Project must not be optimistically removed on failure.
    expect(screen.getByText("Site 24March Studio")).toBeInTheDocument();
    // Dialog stays open so the user can retry or cancel -- no silent failure.
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("picks up a pending success toast left by the workspace page after a redirect-on-delete", async () => {
    window.sessionStorage.setItem(
      "orbit:pending-toast",
      JSON.stringify({ kind: "success", text: '"Ancien projet" a été supprimé.' })
    );
    await renderLoaded();

    expect(await screen.findByRole("status")).toHaveTextContent(/Ancien projet.*supprimé/i);
    // Consumed once -- not re-shown on a later render/navigation.
    expect(window.sessionStorage.getItem("orbit:pending-toast")).toBeNull();
  });
});
