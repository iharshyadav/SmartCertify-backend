"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_route_1 = __importDefault(require("./routes/user-route"));
// Create Express application
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware for parsing JSON and urlencoded data
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Basic route
app.use("/api/users", user_route_1.default);
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
exports.default = app;
