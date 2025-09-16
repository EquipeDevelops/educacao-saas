// src/types/mui.d.ts
import type { PaletteColorOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    accents: Palette["primary"];
  }
  interface PaletteOptions {
    accents?: PaletteColorOptions;
  }
}
