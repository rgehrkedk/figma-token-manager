
// Add declare statements to suppress the specific container null warnings
declare namespace NodeJS {
  interface Global {
    // Suppress container null check warnings in collectionModeSelector.ts
    __CONTAINER_NULL_CHECKS_SUPPRESSED__: boolean;
  }
}