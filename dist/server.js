"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const user_route_1 = __importDefault(require("./routes/user-route"));
const ml_route_1 = __importDefault(require("./routes/ml-route"));
const certificate_route_1 = __importDefault(require("./routes/certificate-route"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use(express_1.default.json({ limit: '50mb' }));
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'https://smart-certify-frontend.vercel.app'],
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use("/api/users", user_route_1.default);
app.use("/api/ml", ml_route_1.default);
app.use("/api/certificates", certificate_route_1.default);
app.get('/', (req, res) => {
    res.send('Hello, world!');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
exports.default = app;
