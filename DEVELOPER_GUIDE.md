# Figma Token Manager - Developer Guide

This document provides detailed technical information about the Figma Token Manager plugin to help new developers understand the codebase and contribute effectively.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [Code Organization](#code-organization)
4. [Token Extraction System](#token-extraction-system)
5. [Reference Resolution System](#reference-resolution-system)
6. [UI Components](#ui-components)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Figma Token Manager is structured as a standard Figma plugin with two main parts:

1. **Plugin-side code** (`src/code.ts`, `src/code/`): Runs in Figma's plugin context and has access to the Figma API
2. **UI-side code** (`src/ui/`): Runs in an iframe and handles the user interface

Communication between these two parts happens through Figma's message passing API:
- Plugin to UI: `figma.ui.postMessage()`
- UI to Plugin: `parent.postMessage({ pluginMessage: ... })`

## Core Concepts

### Design Tokens

Design tokens are named entities that store design decisions, such as colors, typography, and spacing. In our implementation, tokens follow either:

- **DTCG Format**: Design Token Community Group specification with `$value` and `$type` properties
- **Legacy Format**: Simpler key-value format without type metadata

### Token Collections & Modes

Tokens are organized hierarchically:
- **Collections**: Top-level groupings (e.g., "global", "components")
- **Modes**: Variations within collections (e.g., "light", "dark")

### Reference Resolution

References allow tokens to reference other tokens' values using syntax like `{colors.red.500}`. Our plugin implements an enhanced reference resolver inspired by Style Dictionary that:

1. Builds a flattened map of all tokens
2. Resolves references using dot notation (`colors.red.500`) and slash notation (`colors/red/500`)
3. Supports nested references (references that contain other references)
4. Provides diagnostic information for broken references

## Code Organization
