import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

export default {
  input: "index.js",
  output: {
    file: "dist/index.js",
    format: "esm",
    sourcemap: true,
    inlineDynamicImports: true, // Keep dynamic imports intact
  },
  plugins: [
    commonjs({
      dynamicRequireTargets: [
        "node_modules/mongoose/**/*", // Allow dynamic requires for mongoose
      ],
    }),
    json(),
    terser(), // Optional minification
    resolve({
      preferBuiltins: true, // Keep Node.js built-ins as external
    }),
  ],
  external: [
    "fs",
    "path",
    "url", 
    "aws-sdk",
    "node-forge",
    "crypto", // Node built-ins
    "mongoose", // Ensure Mongoose is used from the user app
    "sequelize",
  ],
};
