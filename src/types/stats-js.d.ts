declare module 'stats-js' {
  interface Stats {
    /**
     * @param mode 0: fps, 1: ms, 2: mb, 3+: custom
     */
    setMode(mode: number): void;
    
    /**
     * DOM element that contains the stats display
     */
    domElement: HTMLElement;
    
    /**
     * Start timing
     */
    begin(): void;
    
    /**
     * End timing
     */
    end(): void;
    
    /**
     * Update the stats display
     */
    update(): void;
  }

  interface StatsConstructor {
    new(): Stats;
    (): Stats;
  }

  const Stats: StatsConstructor;
  export = Stats;
}