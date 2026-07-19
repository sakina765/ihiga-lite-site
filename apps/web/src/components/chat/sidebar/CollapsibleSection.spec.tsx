import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back to defaultOpen when nothing is stored yet (first-ever visit)", () => {
    render(
      <CollapsibleSection title="Today's weather" defaultOpen={false} storageKey="ihiga_sidebar_weather_open">
        <p>content</p>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /today's weather/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("persists the open state to localStorage under the given key when toggled", () => {
    render(
      <CollapsibleSection title="Today's weather" defaultOpen={true} storageKey="ihiga_sidebar_weather_open">
        <p>content</p>
      </CollapsibleSection>,
    );

    fireEvent.click(screen.getByRole("button", { name: /today's weather/i }));

    expect(window.localStorage.getItem("ihiga_sidebar_weather_open")).toBe("false");
  });

  it("restores a stored 'true' value on next mount, overriding a false default", () => {
    window.localStorage.setItem("ihiga_sidebar_weather_open", "true");

    render(
      <CollapsibleSection title="Today's weather" defaultOpen={false} storageKey="ihiga_sidebar_weather_open">
        <p>content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("restores a stored 'false' value on next mount, overriding a true default", () => {
    window.localStorage.setItem("ihiga_sidebar_weather_open", "false");

    render(
      <CollapsibleSection title="Today's weather" defaultOpen={true} storageKey="ihiga_sidebar_weather_open">
        <p>content</p>
      </CollapsibleSection>,
    );

    expect(screen.queryByText("content")).not.toBeInTheDocument();
  });

  it("keys persistence per section — one section's stored state never leaks into another's", () => {
    window.localStorage.setItem("ihiga_sidebar_weather_open", "false");

    render(
      <CollapsibleSection title="Regional weather" defaultOpen={true} storageKey="ihiga_sidebar_regional_open">
        <p>regional content</p>
      </CollapsibleSection>,
    );

    // Unaffected by the OTHER section's stored "false" — opens per its own defaultOpen.
    expect(screen.getByText("regional content")).toBeInTheDocument();
    // Writes only its own key on mount, never the other section's.
    expect(window.localStorage.getItem("ihiga_sidebar_weather_open")).toBe("false");
    expect(window.localStorage.getItem("ihiga_sidebar_regional_open")).toBe("true");
  });

  it("works with no storageKey at all (e.g. a section with no persistence) — no crash, nothing written", () => {
    render(
      <CollapsibleSection title="Crop suggestions" defaultOpen={true}>
        <p>content</p>
      </CollapsibleSection>,
    );

    fireEvent.click(screen.getByRole("button", { name: /crop suggestions/i }));

    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
  });

  it("shows a risk indicator on the header even while collapsed", () => {
    render(
      <CollapsibleSection title="Today's weather" defaultOpen={false} risk={true}>
        <p>content</p>
      </CollapsibleSection>,
    );

    const button = screen.getByRole("button", { name: /today's weather/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button.className).toContain("text-clay");
  });

  it("does not show a risk indicator by default", () => {
    render(
      <CollapsibleSection title="Regional weather" defaultOpen={false}>
        <p>content</p>
      </CollapsibleSection>,
    );

    expect(screen.getByRole("button", { name: /regional weather/i }).className).not.toContain("text-clay");
  });
});
