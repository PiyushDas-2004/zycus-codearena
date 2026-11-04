/**
 * Type declarations given to the editor's TypeScript service, so mistakes in candidates' code are
 * reported (wrong props, misspelt APIs, missing imports) exactly as in a real React Native project.
 * Loaded lazily (a separate chunk) when the workspace opens. React's files are imported by root path,
 * not through a package alias: Vite would try to pre-bundle an alias (504 "Outdated Optimize Dep").
 */
import reactGlobal from '/node_modules/@types/react/global.d.ts?raw';
import reactIndex from '/node_modules/@types/react/index.d.ts?raw';
import reactJsxDev from '/node_modules/@types/react/jsx-dev-runtime.d.ts?raw';
import reactJsx from '/node_modules/@types/react/jsx-runtime.d.ts?raw';
import csstype from './csstype.d.txt?raw';
import jestGlobals from './jest-globals.d.txt?raw';
import libraries from './libraries.d.txt?raw';
import reactNative from './react-native.d.txt?raw';

export const editorTypeLibs: { filePath: string; content: string }[] = [
  { filePath: 'file:///node_modules/@types/react/index.d.ts', content: reactIndex },
  { filePath: 'file:///node_modules/@types/react/global.d.ts', content: reactGlobal },
  { filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts', content: reactJsx },
  { filePath: 'file:///node_modules/@types/react/jsx-dev-runtime.d.ts', content: reactJsxDev },
  { filePath: 'file:///node_modules/csstype/index.d.ts', content: csstype },
  { filePath: 'file:///node_modules/@codearena/types/react-native.d.ts', content: reactNative },
  { filePath: 'file:///node_modules/@codearena/types/libraries.d.ts', content: libraries },
  { filePath: 'file:///node_modules/@codearena/types/jest-globals.d.ts', content: jestGlobals },
];
