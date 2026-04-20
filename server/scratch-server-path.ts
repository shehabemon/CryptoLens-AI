import path from "path";

const __dirname = new URL(".", import.meta.url).pathname;
console.log("__dirname in server:", __dirname);
console.log("concat:", __dirname + "../dist/index.html");
console.log("path.join:", path.join(__dirname, "../dist/index.html"));
