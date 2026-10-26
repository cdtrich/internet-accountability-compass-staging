// Automatically detects dev vs production
export const basePath = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);
