"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
require("dotenv/config");
const twilio_1 = require("twilio");
exports.userRouter = express_1.default.Router();
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, phonenumber } = req.body;
}));
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID, PORT } = process.env;
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio credentials are not set in environment variables.');
}
const client = new twilio_1.Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
exports.userRouter.post('/send-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber } = req.body;
    try {
        const verification = yield client.verify
            .services(TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: phoneNumber, channel: 'sms' });
        res.status(200).json({ status: verification.status });
    }
    catch (error) {
        console.error('Twilio Error:', error); // <-- PRINT FULL ERROR
        //@ts-ignore
        res.status(500).json({ error: error.message || 'Failed to send OTP' }); // <-- SEND FULL MESSAGE
    }
}));
// Endpoint to verify OTP
exports.userRouter.post('/verify-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, code } = req.body;
    try {
        const verificationCheck = yield client.verify
            .services(TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: phoneNumber, code });
        if (verificationCheck.status === 'approved') {
            // Proceed to save user data to the database
            res.status(200).json({ message: 'Phone number verified successfully.' });
        }
        else {
            res.status(400).json({ error: 'Invalid OTP.' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
}));
