export type Area = "reception" | "gallery" | "services" | "consultation";
export const areaLabels = { reception: "Reception", gallery: "Portfolio gallery", services: "Services atelier", consultation: "Consultation lounge" } as const;
export type StudioState = {
  mode: "static" | "loading" | "intro" | "explore" | "failed";
  area: Area;
  panel: boolean;
  tour: boolean;
  manual: boolean;
  shot: number;
};
export type StudioEvent =
  | { type: "enter" | "ready" | "skip" | "fail" | "static" | "close" | "manual" | "tour" | "reset" }
  | { type: "select"; area: Area }
  | { type: "advance" };

export const areaOrder: Area[] = ["reception", "gallery", "services", "consultation"];
export const initialStudioState: StudioState = {
  mode: "static", area: "reception", panel: false, tour: false, manual: false, shot: 0,
};

export function studioReducer(state: StudioState, event: StudioEvent): StudioState {
  switch (event.type) {
    case "enter": return { ...initialStudioState, mode: "loading", shot: state.shot + 1 };
    case "ready": return state.mode === "loading" ? { ...state, mode: "intro" } : state;
    case "skip": return state.mode === "intro" || state.mode === "loading" ? { ...state, mode: "explore", shot: state.shot + 1 } : state;
    case "fail": return { ...state, mode: "failed", tour: false, panel: false };
    case "static": return { ...initialStudioState, shot: state.shot + 1 };
    case "select": return { ...state, mode: (state.mode === "intro" || state.mode === "loading") ? "explore" : state.mode, area: event.area, panel: true, tour: false, manual: false, shot: state.shot + 1 };
    case "close": return { ...state, panel: false, tour: false };
    case "manual": return { ...state, mode: (state.mode === "intro" || state.mode === "loading") ? "explore" : state.mode, manual: true, tour: false };
    case "reset": return { ...state, panel: false, tour: false, manual: false, shot: state.shot + 1 };
    case "tour": return { ...state, mode: "explore", area: state.tour ? state.area : "reception", tour: !state.tour, panel: false, manual: state.tour, shot: state.shot + 1 };
    case "advance": {
      if (!state.tour) return state;
      const index = areaOrder.indexOf(state.area);
      if (index === areaOrder.length - 1) return { ...state, tour: false, panel: true };
      return { ...state, area: areaOrder[index + 1], manual: false, shot: state.shot + 1 };
    }
  }
}
