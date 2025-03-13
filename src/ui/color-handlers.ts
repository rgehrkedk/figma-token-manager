import { ColorFormat } from '../code/formatters/colorUtils';

/**
 * Setup event listeners for color format radio buttons
 */
export function setupColorFormatHandlers() {
  const colorHexRadio = document.getElementById('color-hex') as HTMLInputElement;
  const colorRgbRadio = document.getElementById('color-rgb') as HTMLInputElement;
  const colorRgbaRadio = document.getElementById('color-rgba') as HTMLInputElement;
  const colorHslRadio = document.getElementById('color-hsl') as HTMLInputElement;
  const colorHslaRadio = document.getElementById('color-hsla') as HTMLInputElement;
  
  // Store current color format
  let currentFormat: ColorFormat = 'hex';
  
  // Send message to plugin when a color format is selected
  function sendColorFormatMessage(format: ColorFormat) {
    console.log(`Sending color format to plugin: ${format}`);
    parent.postMessage({ 
      pluginMessage: { 
        type: 'apply-color-format',
        colorFormat: format
      }
    }, '*');
  }
  
  // Add event listeners to each radio button
  colorHexRadio?.addEventListener('change', () => {
    if (colorHexRadio.checked && currentFormat !== 'hex') {
      currentFormat = 'hex';
      sendColorFormatMessage(currentFormat);
    }
  });
  
  colorRgbRadio?.addEventListener('change', () => {
    if (colorRgbRadio.checked && currentFormat !== 'rgb') {
      currentFormat = 'rgb';
      sendColorFormatMessage(currentFormat);
    }
  });
  
  colorRgbaRadio?.addEventListener('change', () => {
    if (colorRgbaRadio.checked && currentFormat !== 'rgba') {
      currentFormat = 'rgba';
      sendColorFormatMessage(currentFormat);
    }
  });
  
  colorHslRadio?.addEventListener('change', () => {
    if (colorHslRadio.checked && currentFormat !== 'hsl') {
      currentFormat = 'hsl';
      sendColorFormatMessage(currentFormat);
    }
  });
  
  colorHslaRadio?.addEventListener('change', () => {
    if (colorHslaRadio.checked && currentFormat !== 'hsla') {
      currentFormat = 'hsla';
      sendColorFormatMessage(currentFormat);
    }
  });
  
  // Initialize the current format (hex is default)
  currentFormat = 'hex';
  if (colorHexRadio) {
    colorHexRadio.checked = true;
  }
}