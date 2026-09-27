export interface Scene {
  /** Subject position on the map axis, m. */
  focus: number;
  /** Subject diameter, m. */
  size: number;
  /** Length of the map, m. */
  mapSize: number;
}

export interface Options {
  lock: boolean;
  thirdStops: boolean;
  separateMaps: boolean;
  showZone: boolean;
  /** Which sensor the 3D view shows, or all of them side by side. */
  view: number | 'all';
}
