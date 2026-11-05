export type Area = "reception" | "gallery" | "services" | "consultation";
export const areaLabels = { reception: "Reception", gallery: "Portfolio gallery", services: "Services atelier", consultation: "Consultation lounge" } as const;
export type StudioState = {
  mode: "static" | "loading" | "arrival" | "intro" | "explore" | "failed";
  area: Area;
  panel: boolean;
  /** The guided tour is advancing on its own. */
  tour: boolean;
  /** A tour exists and can be resumed (it is either running or paused). */
  tourActive: boolean;
  manual: boolean;
  shot: number;
  outside: boolean;
  /** The visitor chose the still view; the selected room is kept when switching views. */
  still: boolean;
  /** Loading the scene to return to the selected room, so the arrival film is skipped. */
  resume: boolean;
  /** Frame the whole studio; only true until the visitor picks a room. */
  overview: boolean;
};
export type StudioEvent =
  | { type: "ready" | "arrive" | "skip" | "fail" | "close" | "manual" | "tour" | "tourStop" | "reset" | "entrance" }
  | { type: "enter"; keep?: boolean }
  | { type: "static" }
  | { type: "select"; area: Area }
  | { type: "advance" };

export const areaOrder: Area[] = ["reception", "gallery", "services", "consultation"];
export const initialStudioState: StudioState = {
  mode: "static", area: "reception", panel: false, tour: false, tourActive: false, manual: false, shot: 0, outside: false, still: false, resume: false, overview: true,
};
const pending = (mode: StudioState["mode"]) => mode === "intro" || mode === "loading" || mode === "arrival";

export function studioReducer(state: StudioState, event: StudioEvent): StudioState {
  switch (event.type) {
    case "enter":
      // Returning from the still view keeps the room and its panel; a first visit starts from the street.
      return event.keep
        ? { ...state, mode: "loading", still: false, resume: true, tour: false, tourActive: false, manual: false, outside: false, overview: false, shot: state.shot + 1 }
        : { ...initialStudioState, mode: "loading", shot: state.shot + 1 };
    case "ready":
      if (state.mode !== "loading") return state;
      return state.resume ? { ...state, mode: "explore", resume: false, shot: state.shot + 1 } : { ...state, mode: "arrival", shot: state.shot + 1 };
    case "arrive": return state.mode === "arrival" ? { ...state, mode: "intro", shot: state.shot + 1 } : state;
    case "skip": return pending(state.mode) ? { ...state, mode: "explore", resume: false, shot: state.shot + 1 } : state;
    case "fail": return { ...state, mode: "failed", tour: false, tourActive: false, panel: false, resume: false };
    case "static":
      // Still view keeps the selected room; leaving 3D opens its details so the view is useful immediately.
      return { ...state, mode: "static", still: true, panel: state.mode === "static" || state.mode === "failed" ? state.panel : true, tour: false, tourActive: false, manual: false, outside: false, resume: false, shot: state.shot + 1 };
    case "select": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, area: event.area, panel: true, tour: false, tourActive: false, manual: false, outside: false, overview: false, resume: false, shot: state.shot + 1 };
    // Closing details pauses a running tour but stays in the room.
    case "close": return { ...state, panel: false, tour: false, overview: false };
    // Orbiting pauses a tour; it can still be resumed from the same room.
    case "manual": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, manual: true, tour: false };
    // Reset re-frames the current room. It never changes room, panel or the entrance view.
    case "reset": return { ...state, tour: false, manual: false, outside: false, overview: false, shot: state.shot + 1 };
    // Back to entrance is the street view in front of the studio; it ends any tour and closes details.
    case "entrance": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, panel: false, tour: false, tourActive: false, manual: false, outside: true, shot: state.shot + 1 };
    case "tour":
      if (state.tour) return { ...state, tour: false, manual: true };
      if (state.tourActive) return { ...state, mode: "explore", tour: true, manual: false, panel: false, outside: false, overview: false, shot: state.shot + 1 };
      return { ...state, mode: "explore", area: "reception", tour: true, tourActive: true, panel: false, manual: false, outside: false, overview: false, shot: state.shot + 1 };
    case "tourStop": return { ...state, tour: false, tourActive: false };
    case "advance": {
      if (!state.tour) return state;
      const index = areaOrder.indexOf(state.area);
      if (index === areaOrder.length - 1) return { ...state, tour: false, tourActive: false, panel: true };
      return { ...state, area: areaOrder[index + 1], manual: false, shot: state.shot + 1 };
    }
  }
}
