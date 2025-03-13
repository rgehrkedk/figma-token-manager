I've created the `TokenCard.ts` component that displays individual tokens with special handling for references. This component is a key part of our implementation.

## Purpose

The TokenCard component serves as the primary visual representation of a design token. It handles:

1. **Visual display**: Shows an appropriate visualization based on token type (color, dimension, etc.)
2. **Reference display**: For reference tokens, shows the reference path instead of the resolved value
3. **Value formatting**: Formats token values appropriately for display

## Key Features

- **Type-specific visualizations**: Different display formats for colors, dimensions, typography, etc.
- **Reference indicators**: Visual cues showing that a token is a reference (↗ icon)
- **Clear reference paths**: Shows the reference path without curly braces for better readability
- **Resolved value visualization**: Uses the resolved value for visualization while showing the reference path as text

## Implementation Details

The component follows our requirements by:

1. **Using resolved values for visualization**: For color swatches, dimension bars, etc.
2. **Showing reference paths as values**: Displays the reference path (without curly braces) instead of the resolved value
3. **Visual distinction for references**: Adds specific classes to style references differently
4. **Click handler**: Passes the token data to the provided onClick handler (which will show the details panel)

## Styling

The component adds specific classes to enable styling:
- `.token-card.is-reference` for reference tokens
- `.reference-value` for reference value text
- `.reference-indicator` for the reference icon

This follows our plan of having clear visual distinction for references while keeping the styles in a separate CSS file.

Next, I'll create the `TokenDetails.ts` component that will display detailed information about a selected token.