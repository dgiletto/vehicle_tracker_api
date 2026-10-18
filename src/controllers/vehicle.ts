import VehicleService from "../services/vehicle";
import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";

class VehicleController {
    constructor(private vehicleService: VehicleService) {}

    createVehicle = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized"
                });
                return;
            }

            const {
                vin,
                year,
                make,
                model,
                trim
            } = req.body;

            // A vin and year can be provided on its own or a year, make, and model need to be entered
            if ((!vin || !year) && (!year || !make || !model)) {
                res.status(400).json({
                    message: "Provide a VIN and year or enter the vehicle's year, make, and model"
                });
                return;
            }

            const vehicle = await this.vehicleService.createVehicle(
                {
                    userId,
                    ...(vin !== undefined && { vin }),
                    ...(year !== undefined && { year }),
                    ...(make !== undefined && { make }),
                    ...(model !== undefined && { model }),
                    ...(trim !== undefined && { trim })
                }
            );

            res.status(201).json({
                message: "Vehicle created successfully",
                data: vehicle
            });
        } catch (error: any) {
            if (error.message === "A vehicle with this VIN already exists for this user.") {
                res.status(409).json({
                    message: "A vehicle with this vin already exists"
                });
                return;
            }

            errorHandler(res, error);
        }
    }

    getVehicle = async (req: Request, res: Response): Promise<void> => {
        try {
            let { vehicleId } = req.params;
            const userId = req.user?.id;

            if (Array.isArray(vehicleId)) {
                vehicleId = vehicleId[0];
            }

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized"
                });
                return;
            }

            if (!vehicleId) {
                res.status(400).json({
                    message: "Vehicle ID is required"
                });
                return;
            }

            const vehicle = await this.vehicleService.getVehicle(
                userId,
                vehicleId,
            );

            res.status(200).json({ vehicle });
        } catch (error) {
            errorHandler(res, error);
        }
    }

    getVehicles = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ 
                    message: "Unauthorized"
                });
                return;
            }

            const vehicles = await this.vehicleService.getVehicles(userId);

            res.status(200).json({
                count: vehicles?.length,
                vehicles
            });
        } catch (error) {
            errorHandler(res, error);
        }
    }

    patchVehicle = async (req: Request, res: Response): Promise<void> => {
        try {
            let { vehicleId } = req.params;
            const userId = req.user?.id;

            if (Array.isArray(vehicleId)) {
                vehicleId = vehicleId[0];
            }

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized"
                });
                return;
            }

            if (!vehicleId) {
                res.status(400).json({
                    message: "Vehicle Id is required"
                });
                return;
            }

            const {
                year,
                make,
                model,
                trim
            } = req.body;

            const updatedVehicle = await this.vehicleService.patchVehicle(
                userId,
                vehicleId,
                {
                    ...(year !== undefined && { year }),
                    ...(make !== undefined && { make }),
                    ...(model !== undefined && { model }),
                    ...(trim !== undefined && { trim })
                }
            );

            res.status(200).json(updatedVehicle);
        } catch (error) {
            errorHandler(res, error);
        }
    }

    deleteVehicle = async (req: Request, res: Response): Promise<void> => {
        try {
            let { vehicleId } = req.params;
            const userId = req.user?.id;

            if (Array.isArray(vehicleId)) {
                vehicleId = vehicleId[0];
            }

            if (!vehicleId) {
                res.status(400).json({
                    message: "Vehicle Id is required"
                });
                return;
            }

            if (!userId) {
                res.status(401).json({
                    message: "Unauthorized"
                });
                return;
            }

            const result = await this.vehicleService.deleteVehicle(userId, vehicleId);

            res.status(200).json(result);
        } catch (error) {
            errorHandler(res, error);
        }
    }
}

export default VehicleController;