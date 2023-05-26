/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {
  /** Folders to index: - Comma-separated list of paths to index. */
  "paths": string,
  /** Grid size: - Set the size of the image grid. */
  "itemSize": "small" | "medium" | "large",
  /** Preferences: - Check to include video files in the grid. */
  "videos": boolean,
  /**  - Check to show filenames in the grid. */
  "titles": boolean
}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
}
