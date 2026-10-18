import prisma from "../config/prisma";
import axios from "axios";

interface CreateVehicleData {
    userId: string,
    vin?: string | undefined,
    make?: string,
    model?: string,
    year?: number,
    trim?: string
}

interface UpdateVehicleData {
    year?: number,
    make?: string,
    model?: string,
    trim?: string | null
}

class VehicleService {
    // Get a specific vehicle correlated with a user
    getVehicle = async (userId: string, vehicleId: string) => {
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: vehicleId,
                userId: userId
            }
        });

        if (!vehicle) {
            throw new Error("Vehicle not found");
        }

        return vehicle;
    };

    // Get all of the vehicles a user owns
    getVehicles = async (userId: string) => {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                userId: userId
            }
        });

        if (vehicles && vehicles.length > 0) {
            return vehicles;
        }

        return null;
    };

    // Create a new vehicle for a valid userId
    createVehicle = async ({userId, vin, make, model, year, trim}: CreateVehicleData) => {
        let vehicleData = {
            year,
            make,
            model,
            trim,
            vin: vin ?? null
        };

        // Check if a vehicle with the same VIN already exists 
        if (vin) {
            const existingVehicle = await prisma.vehicle.findFirst({
                where: {
                    userId,
                    vin
                }
            });

            if (existingVehicle) {
                throw new Error("A vehicle with this VIN already exists for this user.");
            }
        }

        // If vin and year are provided decode them to get vehicle information
        if (vin && year) {
            const decodedVehicle = await this.decodeVin(vin, year);

            vehicleData = {
                vin,
                year,
                make: decodedVehicle.make,
                model: decodedVehicle.model,
                trim: decodedVehicle.trim
            };
        } else {
            // If no vin then we need the other information to create the vehicle
            if (!year || !make || !model) {
                throw new Error("Year, make, and model are required when VIN is not provided");
            }
        }

        // Create new vehicle either with decoded data or data provided
        return prisma.vehicle.create({
            data: {
                userId,
                vin: vehicleData.vin,
                year: vehicleData.year!,
                make: vehicleData.make!,
                model: vehicleData.model!,
                trim: vehicleData.trim ?? null
            }
        });
    };

    // Use external nhtsa api to decode vins with the help of the model year
    private decodeVin = async (vin: string, year: number) => {
        const decodeVinResponse = await axios.get(
            `https://vpic.nhtsa.dot.gov/api/vehicles/decodeVin/${vin}?format=json&modelyear=${year}`
        );

        const results = decodeVinResponse.data.Results
        return {
            make: results.find((item: any) => item.Variable === 'Make')?.Value,
            model: results.find((item: any) => item.Variable === 'Model')?.Value,
            trim: results.find((item: any) => item.Variable === 'Trim')?.Value
        }
    }

    // Delete a users vehicle
    deleteVehicle = async (userId: string, vehicleId: string) => {
        // Find the vehicle in reference and make sure the user matches
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: vehicleId,
                userId
            }
        });

        if (!vehicle) {
            throw new Error("Vehicle not found");
        }

        await prisma.vehicle.delete({
            where: {
                id: vehicleId
            }
        });

        return { message: "Vehicle Deleted Successfully" }
    }

    // Partially edit a users vehicle
    patchVehicle = async (userId: string, vehicleId: string, data: UpdateVehicleData) => {
        // Find the vehicle in reference and make sure the user matches
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: vehicleId,
                userId
            }
        });

        if (!vehicle) {
            throw new Error("Vehicle not found");
        }

        // Only update the fields explicitly defined by the user
        const updatedVehicle = await prisma.vehicle.update({
            where: {
                id: vehicleId,
                userId
            },
            data: {
                ...(data.year !== undefined && { year: data.year }),
                ...(data.make !== undefined && { make: data.make }),
                ...(data.model !== undefined && { model: data.model }),
                ...(data.trim !== undefined && { trim: data.trim }) 
            },
        });

        return updatedVehicle;
    }
}

export default VehicleService;