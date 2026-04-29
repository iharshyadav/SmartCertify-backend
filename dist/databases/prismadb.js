"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("@prisma/client"));
const PrismaClient = client_1.default.PrismaClient;
let prisma;
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
}
else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}
exports.default = prisma;
