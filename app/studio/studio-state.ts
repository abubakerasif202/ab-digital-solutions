export type Area = "reception" | "gallery" | "services" | "consultation";
export const areaLabels = { reception: "Reception", gallery: "Portfolio gallery", services: "Services atelier", consultation: "Consultation lounge" } as const;
export type StudioState = {
  mode: "static" | "loading" | "arrival" | "intro" | "explore" | "failed";
  area: Area;
  panel: boolean;
  tour: boolean;
  manual: boolean;
  shot: number;
  outside: boolean;
};
export type StudioEvent =
  | { type: "enter" | "ready" | "arrive" | "skip" | "fail" | "static" | "close" | "manual" | "tour" | "reset" | "entrance" }
  | { type: "select"; area: Area }
  | { type: "advance" };

export const areaOrder: Area[] = ["reception", "gallery", "services", "consultation"];
export const initialStudioState: StudioState = {
  mode: "static", area: "reception", panel: false, tour: false, manual: false, shot: 0, outside: false,
};
const pending = (mode: StudioState["mode"]) => mode === "intro" || mode === "loading" || mode === "arrival";

export function studioReducer(state: StudioState, event: StudioEvent): StudioState {
  switch (event.type) {
    case "enter": return { ...initialStudioState, mode: "loading", shot: state.shot + 1 };
    case "ready": return state.mode === "loading" ? { ...state, mode: "arrival", shot: state.shot + 1 } : state;
    case "arrive": return state.mode === "arrival" ? { ...state, mode: "intro", shot: state.shot + 1 } : state;
    case "skip": return pending(state.mode) ? { ...state, mode: "explore", shot: state.shot + 1 } : state;
    case "fail": return { ...state, mode: "failed", tour: false, panel: false };
    case "static": return { ...initialStudioState, shot: state.shot + 1 };
    case "select": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, area: event.area, panel: true, tour: false, manual: false, outside: false, shot: state.shot + 1 };
    case "close": return { ...state, panel: false, tour: false };
    case "manual": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, manual: true, tour: false };
    case "reset": return { ...state, panel: false, tour: false, manual: false, outside: false, shot: state.shot + 1 };
    case "entrance": return { ...state, mode: pending(state.mode) ? "explore" : state.mode, panel: false, tour: false, manual: false, outside: true, shot: state.shot + 1 };
    case "tour": return { ...state, mode: "explore", area: state.tour ? state.area : "reception", tour: !state.tour, panel: false, manual: state.tour, outside: false, shot: state.shot + 1 };
    case "advance": {
      if (!state.tour) return state;
      const index = areaOrder.indexOf(state.area);
      if (index === areaOrder.length - 1) return { ...state, tour: false, panel: true };
      return { ...state, area: areaOrder[index + 1], manual: false, shot: state.shot + 1 };
    }
  }
}
