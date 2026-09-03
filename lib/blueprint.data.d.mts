export type BlueprintGroup = "truck" | "deck" | "upright" | "ramp" | "wheel" | "vehicle" | "structure" | "tick" | "ground";

export type BlueprintPath = { id: string; d: string; group: BlueprintGroup; vehicle?: number; fill?: boolean };

export type BlueprintCallout = { id: string; text: string; x: number; y: number; anchor: "start" | "middle" | "end"; leader: string };

export type BlueprintHighlight = { vehicles?: number[]; groups?: string[] };

export type BlueprintView = { viewBox: string; callouts: boolean; highlight?: BlueprintHighlight; hide?: string[]; showPin?: boolean };

export type BlueprintViewKey = "full" | "transit" | "deck" | "ramp" | "delivery" | "cab" | "iconCar" | "iconRows" | "iconHauler";

export const BLUEPRINT_VIEWBOX: string;
export const BLUEPRINT_PATHS: BlueprintPath[];
export const BLUEPRINT_CALLOUTS: BlueprintCallout[];
export const BLUEPRINT_VIEWS: Record<BlueprintViewKey, BlueprintView>;
export const BLUEPRINT_ORDER: BlueprintGroup[];
