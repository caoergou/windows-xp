declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}

declare module '*.ico' {
  const value: string;
  export default value;
}

declare module '*.wav' {
  const value: string;
  export default value;
}

declare module '*.cur' {
  const value: string;
  export default value;
}

declare module '*.woff' {
  const value: string;
  export default value;
}

// `?inline` CSS imports yield the processed sheet as a string (postcss plugins
// still run — that is how the xp.css scope prefix is applied) without mounting
// it into the DOM; the theme layer carries it as `OSTheme.css` (#213 B1).
declare module '*.css?inline' {
  const value: string;
  export default value;
}
