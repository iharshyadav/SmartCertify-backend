process.env.VERCEL = process.env.VERCEL || "1";
const serverModule = require("../dist/server.js");
module.exports = serverModule.default || serverModule;
