import path from "path";
import { decodeFilesInDir } from "./testcase-creator";

decodeFilesInDir(path.resolve(__dirname, "images/no-compression"));
