import { Router } from "express";
import VehicleService from "../services/vehicle";
import authenticate from "../middleware/authMiddleware";
import VehicleController from "../controllers/vehicle";

const vehicleRouter = Router();

const vehicleService = new VehicleService();
const vehicleController = new VehicleController(vehicleService);

vehicleRouter.post("/", authenticate, vehicleController.createVehicle);
vehicleRouter.get("/:vehicleId", authenticate, vehicleController.getVehicle);
vehicleRouter.get("/", authenticate, vehicleController.getVehicles);
vehicleRouter.patch("/:vehicleId", authenticate, vehicleController.patchVehicle);
vehicleRouter.delete("/:vehicleId", authenticate, vehicleController.deleteVehicle);

export default vehicleRouter;