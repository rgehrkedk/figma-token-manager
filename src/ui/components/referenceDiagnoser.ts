/**
 * Component for diagnosing and fixing reference issues
 */

import { buildTokenReferenceMap, diagnoseReferenceIssues } from '../utilities/styleReferences';

/**
 * Analyzes unresolved references and provides diagnosis information
 */
export function analyzeReferenceIssues(tokenData: any, containerEl: HTMLElement) {
  // Get diagnosis results
  const diagnosis = diagnoseReferenceIssues(tokenData);
  
  // Prepare the HTML
  let html = '';
  
  if (diagnosis.unresolvedReferences.length === 0) {
    html = `
      <div class="reference-diagnosis">
        <h3>Reference Analysis</h3>
        <div class="diagnosis-success">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM7 11.4L3.6 8L5 6.6L7 8.6L11 4.6L12.4 6L7 11.4Z" fill="#22863a"/>
          </svg>
          <span>All references were resolved successfully!</span>
        </div>
      </div>
    `;
  } else {
    html = `
      <div class="reference-diagnosis">
        <h3>Reference Analysis</h3>
        <div class="diagnosis-summary">
          Found ${diagnosis.unresolvedReferences.length} unresolved references.
          ${diagnosis.suggestedFixes.length > 0 ? `${diagnosis.suggestedFixes.length} can be automatically fixed.` : ''}
        </div>
        
        <div class="unresolved-references">
          <h4>Unresolved References</h4>
          <table class="reference-table">
            <thead>
              <tr>
                <th>Token Path</th>
                <th>Reference</th>
                <th>Potential Matches</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // Add each unresolved reference
    diagnosis.unresolvedReferences.forEach(issue => {
      let potentialMatchesHtml = '';
      
      if (issue.potentialMatches.length > 0) {
        potentialMatchesHtml = issue.potentialMatches
          .map(match => `<div class="potential-match" data-similarity="${Math.round(match.similarity * 100)}%">
                          <span class="match-path">${match.path}</span>
                          <span class="match-similarity">${Math.round(match.similarity * 100)}%</span>
                        </div>`)
          .join('');
      } else {
        potentialMatchesHtml = '<div class="no-matches">No potential matches found</div>';
      }
      
      html += `
        <tr>
          <td>${issue.path}</td>
          <td class="reference-value">{${issue.reference}}</td>
          <td>${potentialMatchesHtml}</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
    `;
    
    // Add suggested fixes if available
    if (diagnosis.suggestedFixes.length > 0) {
      html += `
        <div class="suggested-fixes">
          <h4>Suggested Fixes</h4>
          <div class="fix-description">
            These references can be automatically fixed by updating the paths.
          </div>
          <table class="reference-table">
            <thead>
              <tr>
                <th>Token Path</th>
                <th>Original</th>
                <th>Suggested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      diagnosis.suggestedFixes.forEach((fix, index) => {
        html += `
          <tr>
            <td>${fix.path}</td>
            <td class="reference-value">${fix.original}</td>
            <td class="reference-value suggested">${fix.suggested}</td>
            <td>
              <button class="fix-button" data-fix-index="${index}">Apply</button>
            </td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
          <div class="fix-actions">
            <button id="apply-all-fixes">Apply All Fixes</button>
          </div>
        </div>
      `;
    }
    
    html += `
      <div class="reference-recommendations">
        <h4>Recommendations</h4>
        <ul>
          <li>Review the token structure to ensure consistent naming patterns</li>
          <li>Use explicit paths in references when possible</li>
          <li>Consider organizing tokens in a flat structure for easier reference resolution</li>
          <li>For Style Dictionary compatibility, ensure references use the same format</li>
        </ul>
      </div>
    `;
    
    html += '</div>'; // Close reference-diagnosis div
  }
  
  // Set the HTML
  containerEl.innerHTML = html;
  
  // Return diagnosis results for potential use by caller
  return diagnosis;
}

/**
 * Adds event listeners for the reference diagnosis UI components
 */
export function setupReferenceDiagnosisListeners(
  containerEl: HTMLElement,
  tokenData: any,
  onFixApplied: (fixedTokenData: any) => void
) {
  // Get diagnosis data
  const diagnosis = diagnoseReferenceIssues(tokenData);
  
  // Add listener for "Apply All Fixes" button
  const applyAllButton = containerEl.querySelector('#apply-all-fixes');
  if (applyAllButton) {
    applyAllButton.addEventListener('click', () => {
      const fixedTokenData = applyAllFixes(tokenData, diagnosis.suggestedFixes);
      onFixApplied(fixedTokenData);
    });
  }
  
  // Add listeners for individual fix buttons
  const fixButtons = containerEl.querySelectorAll('.fix-button');
  fixButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const fixIndex = parseInt((e.currentTarget as HTMLElement).dataset.fixIndex || '0');
      const fixedTokenData = applySingleFix(tokenData, diagnosis.suggestedFixes[fixIndex]);
      onFixApplied(fixedTokenData);
    });
  });
}

/**
 * Applies all suggested fixes to the token data
 */
function applyAllFixes(tokenData: any, fixes: Array<{ path: string; original: string; suggested: string }>): any {
  let result = JSON.parse(JSON.stringify(tokenData)); // Deep clone
  
  for (const fix of fixes) {
    result = applySingleFix(result, fix);
  }
  
  return result;
}

/**
 * Applies a single fix to the token data
 */
function applySingleFix(tokenData: any, fix: { path: string; original: string; suggested: string }): any {
  const result = JSON.parse(JSON.stringify(tokenData)); // Deep clone
  const pathParts = fix.path.split('.');
  
  // Navigate to the appropriate object in the token structure
  let current = result;
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    
    if (current[part] === undefined) {
      // If any part doesn't exist, abort
      console.warn(`Path ${fix.path} not found in token data`);
      return result;
    }
    
    if (i === pathParts.length - 1) {
      // We've found the token with the reference
      if (current[part].$value === fix.original) {
        // Update the reference
        current[part].$value = fix.suggested;
      }
    } else {
      current = current[part];
    }
  }
  
  return result;
}

/**
 * Creates CSS for the reference diagnoser
 */
export function getReferenceDiagnoserStyles(): string {
  return `
    .reference-diagnosis {
      margin-top: 20px;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      background-color: #f9f9f9;
    }
    
    .reference-diagnosis h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .reference-diagnosis h4 {
      margin-top: 16px;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .diagnosis-success {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background-color: #e6ffed;
      border-radius: 4px;
      color: #22863a;
      font-weight: 500;
    }
    
    .diagnosis-success svg {
      margin-right: 8px;
    }
    
    .diagnosis-summary {
      padding: 8px 12px;
      background-color: #fff8e1;
      border-radius: 4px;
      color: #b08800;
      margin-bottom: 12px;
    }
    
    .reference-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 16px;
    }
    
    .reference-table th {
      text-align: left;
      padding: 6px 8px;
      background-color: #f0f0f0;
      border: 1px solid #e0e0e0;
    }
    
    .reference-table td {
      padding: 6px 8px;
      border: 1px solid #e0e0e0;
      vertical-align: top;
    }
    
    .reference-value {
      font-family: monospace;
      color: #0366d6;
    }
    
    .reference-value.suggested {
      color: #22863a;
      font-weight: 500;
    }
    
    .potential-match {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .potential-match:last-child {
      border-bottom: none;
    }
    
    .match-path {
      font-family: monospace;
    }
    
    .match-similarity {
      margin-left: 8px;
      color: #666;
      font-size: 10px;
    }
    
    .no-matches {
      color: #d73a49;
      font-style: italic;
    }
    
    .fix-button {
      background-color: #0366d6;
      color: white;
      padding: 3px 8px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      margin: 0;
    }
    
    .fix-button:hover {
      background-color: #0056b3;
    }
    
    .fix-actions {
      margin-top: 12px;
      text-align: right;
    }
    
    .fix-description {
      margin-bottom: 8px;
      color: #666;
      font-size: 11px;
    }
    
    .reference-recommendations {
      background-color: #f0f7ff;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 16px;
    }
    
    .reference-recommendations ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }
    
    .reference-recommendations li {
      margin-bottom: 4px;
      font-size: 11px;
    }
  `;
}