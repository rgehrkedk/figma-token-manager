/**
 * Component for displaying status messages to the user
 */

export enum StatusType {
  INFO = 'info',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

/**
 * Updates the status indicator with the given message and type
 */
export function updateStatus(
  statusElement: HTMLElement,
  message: string,
  type: StatusType = StatusType.INFO
): void {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

/**
 * Shows an extraction in progress message
 */
export function showExtractionStatus(statusElement: HTMLElement): void {
  updateStatus(statusElement, 'Extracting tokens...', StatusType.INFO);
}

/**
 * Shows successful extraction status with count
 */
export function showExtractionSuccess(statusElement: HTMLElement, collectionCount: number): void {
  updateStatus(
    statusElement, 
    `Tokens extracted: ${collectionCount} collections found`,
    StatusType.SUCCESS
  );
}

/**
 * Shows download success message
 */
export function showDownloadSuccess(statusElement: HTMLElement): void {
  updateStatus(statusElement, 'Tokens downloaded successfully!', StatusType.SUCCESS);
}