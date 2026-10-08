import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./app.tsx";

const INSIGHT = {
  id: 1,
  brand: 2,
  createdAt: "2026-10-09T00:00:00.000Z",
  text: "Customers prefer blue coats",
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("insight flow", () => {
  it("loads, creates, and deletes insights through the API", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json(INSIGHT, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("We have no insight!");

    fireEvent.click(screen.getByRole("button", { name: "Add insight" }));
    fireEvent.change(screen.getByLabelText("Brand"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Insight"), {
      target: { value: INSIGHT.text },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add insight" })[1]);
    const content = await screen.findByText(INSIGHT.text, { selector: "p" });
    expect(within(content.parentElement!).getByText("Brand 2")).toBeTruthy();
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: 2, text: INSIGHT.text }),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete insight 1" }));
    await screen.findByText("We have no insight!");
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/insights/1", {
      method: "DELETE",
    });
  });

  it("shows a load error instead of the empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load insights",
    );
    expect(screen.queryByText("We have no insight!")).toBeNull();
  });

  it("keeps entered text when creation fails, and allows retry", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([]))
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(Response.json(INSIGHT, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText("We have no insight!");
    fireEvent.click(screen.getByRole("button", { name: "Add insight" }));
    fireEvent.change(screen.getByLabelText("Insight"), {
      target: { value: INSIGHT.text },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add insight" })[1]);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to add insight",
    );
    expect(screen.getByLabelText("Insight")).toHaveValue(INSIGHT.text);
    fireEvent.click(screen.getAllByRole("button", { name: "Add insight" })[1]);
    await screen.findByText(INSIGHT.text);
  });

  it("keeps the insight when deletion fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([INSIGHT]))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await screen.findByText(INSIGHT.text);
    fireEvent.click(screen.getByRole("button", { name: "Delete insight 1" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to delete insight",
    );
    expect(screen.getByText(INSIGHT.text)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete insight 1" }))
        .toBeEnabled()
    );
  });
});
