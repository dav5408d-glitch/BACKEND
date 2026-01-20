"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables FIRST, before anything else
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const providersAvailability_service_1 = require("./services/providersAvailability.service");
const PORT = process.env.PORT || 3002;
// Validate and log available providers
if (!(0, providersAvailability_service_1.validateProvidersConfig)()) {
    process.exit(1);
}
(0, providersAvailability_service_1.logAvailableProviders)();
app_1.default.listen(PORT, () => {
    console.log(`SYNAPSE AI backend running on http://localhost:${PORT}`);
});
