# Figma Plugins Test Case: Multi-Collection Token Management

## Structure Overview
The Figma project consists of **three collections** that define a hierarchical token system: **Globals**, **Brand**, and **Theme**. Each collection has specific modes and dependencies.

---

## Collections and Modes

### 1. Globals Collection
- **Modes:** 1 Default Mode
- **Purpose:** Defines **global, hardcoded values** that serve as the foundational constants across other collections.
- **References:** Does **not** reference any other collection.
- **Example Tokens:**
  ```json
  {
    "global.primary-color": "#FF5733",
    "global.spacing-base": "8px"
  }
  ```

---

### 2. Brand Collection
- **Modes:** 3 Modes (**Brand A, Brand B, Brand C**)
- **Purpose:** Contains **hardcoded base values** per brand while also referencing tokens from both the **Globals** and **Theme** collections.
- **References:**
  - **Internal references**: Cross-references within the Brand Collection (e.g., `brand-a.primary-color` referring to `brand-a.base-color`).
  - **External references:**
    - Uses **Globals Collection** for foundational values (e.g., `brand-a.button-border-radius = global.border-radius`).
    - Uses **Theme Collection** for contextual (semantic) application (e.g., `brand-a.text-color = theme.light.text-primary`).
- **Example Tokens:**
  ```json
  {
    "brand-a.base-color": "#1A73E8",
    "brand-b.button-bg": "{global.primary-color}",
    "brand-c.text-color": "{theme.light.text-primary}"
  }
  ```

---

### 3. Theme Collection
- **Modes:** 2 Modes (**Light and Dark**)
- **Purpose:** Defines **semantic references** to apply branding styles in different themes.
- **References:**
  - Uses **Brand Collection** to map brand-specific values into the theme.
  - Does **not** reference Globals directly (only through Brand).
- **Example Tokens:**
  ```json
  {
    "theme.light.background": "{brand-a.base-color}",
    "theme.dark.text-primary": "{brand-b.text-color}"
  }
  ```

---

## AI Code Generator Expectations
To correctly generate and manage tokens, an AI code generator must support:
1. **Cross-collection references** (internal and external).
2. **Mode-based overrides** for brand and theme-specific values.
3. **Dynamic semantic mapping** from brand to theme for consistent application.

This structure allows Figma plugins to generate **context-aware tokens** while keeping **global values stable, brand values adaptable, and theme values flexible**.
