# Types
The files in this directory contain types, mostly documentation. They are kept here just for organization and to keep actual code trim. Right now, they are just JSDoc comments, with a dummy export `export {}` at the bottom to indicate to VSCode that this is a module to import JSDoc from, assissting Intellisense. If this project eventually uses typescript, these files can be translated to true TS interfaces for compiler checking.

## Usage
At the top of whatever `.js` file you wish to use the types in:
```js
/**
 * @import {TypeA, TypeB} from "../types/typefile.js"
 */
```