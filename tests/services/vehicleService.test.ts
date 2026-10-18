import { describe, it, expect, vi, beforeEach, type Mock} from "vitest";
import axios from 'axios';
import prisma from "../../src/config/prisma";
import VehicleService from "../../src/services/vehicle";

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            vehicle: {
                findUnique: vi.fn(),
                findFirst: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn()
            },
        }
    };
});

vi.mock("../../src/config/prisma", () => ({
    default: mockPrisma
}));

vi.mock("axios");

const mockedAxios = vi.mocked(axios);

const userId = "user-1";
const vehicleId = "vehicle-1";

const nhtsaResponse = (values: Record<string, string | null>) => ({
    data: {
        Results: Object.entries(values).map(([Variable, Value]) => ({
            Variable,
            Value
        }))
    }
});

describe("VehicleService", () => {
    let service: VehicleService;
 
    beforeEach(() => {
        vi.clearAllMocks();
        service = new VehicleService();
    });
 
    describe("getVehicle", () => {
        it("returns the vehicle scoped to the user", async () => {
            const vehicle = { id: vehicleId, userId, make: "Honda" };
            mockPrisma.vehicle.findUnique.mockResolvedValue(vehicle);
 
            const result = await service.getVehicle(userId, vehicleId);
 
            expect(result).toEqual(vehicle);
            expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
                where: { id: vehicleId, userId }
            });
        });
 
        it("throws when the vehicle does not exist", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
 
            await expect(service.getVehicle(userId, vehicleId)).rejects.toThrow(
                "Vehicle not found"
            );
        });
    });
 
    describe("getVehicles", () => {
        it("returns the user's vehicles", async () => {
            const vehicles = [{ id: "1" }, { id: "2" }];
            mockPrisma.vehicle.findMany.mockResolvedValue(vehicles);
 
            const result = await service.getVehicles(userId);
 
            expect(result).toEqual(vehicles);
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
                where: { userId }
            });
        });
 
        it("returns null when the user has no vehicles", async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);
 
            await expect(service.getVehicles(userId)).resolves.toBeNull();
        });
 
        it("returns null when prisma returns null", async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue(null);
 
            await expect(service.getVehicles(userId)).resolves.toBeNull();
        });
    });
 
    describe("createVehicle", () => {
        describe("without a VIN", () => {
            it("creates a vehicle from year, make, and model", async () => {
                const created = { id: vehicleId };
                mockPrisma.vehicle.create.mockResolvedValue(created);
 
                const result = await service.createVehicle({
                    userId,
                    year: 2020,
                    make: "Toyota",
                    model: "Camry",
                    trim: "SE"
                });
 
                expect(result).toEqual(created);
                expect(mockPrisma.vehicle.findFirst).not.toHaveBeenCalled();
                expect(mockedAxios.get).not.toHaveBeenCalled();
                expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                    data: {
                        userId,
                        vin: null,
                        year: 2020,
                        make: "Toyota",
                        model: "Camry",
                        trim: "SE"
                    }
                });
            });
 
            it("stores trim as null when not provided", async () => {
                mockPrisma.vehicle.create.mockResolvedValue({});
 
                await service.createVehicle({
                    userId,
                    year: 2020,
                    make: "Toyota",
                    model: "Camry"
                });
 
                expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({ trim: null, vin: null })
                });
            });
 
            it.each([
                ["year", { make: "Toyota", model: "Camry" }],
                ["make", { year: 2020, model: "Camry" }],
                ["model", { year: 2020, make: "Toyota" }]
            ])("throws when %s is missing", async (_field, data) => {
                await expect(
                    service.createVehicle({ userId, ...data })
                ).rejects.toThrow(
                    "Year, make, and model are required when VIN is not provided"
                );
 
                expect(mockPrisma.vehicle.create).not.toHaveBeenCalled();
            });
        });
 
        describe("with a VIN", () => {
            const vin = "1HGCM82633A004352";
 
            it("throws when the user already has a vehicle with that VIN", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue({ id: "existing" });
 
                await expect(
                    service.createVehicle({ userId, vin, year: 2003 })
                ).rejects.toThrow(
                    "A vehicle with this VIN already exists for this user."
                );
 
                expect(mockPrisma.vehicle.findFirst).toHaveBeenCalledWith({
                    where: { userId, vin }
                });
                expect(mockedAxios.get).not.toHaveBeenCalled();
                expect(mockPrisma.vehicle.create).not.toHaveBeenCalled();
            });
 
            it("decodes the VIN with the NHTSA API and saves the decoded data", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue(null);
                mockedAxios.get.mockResolvedValue(
                    nhtsaResponse({ Make: "HONDA", Model: "Accord", Trim: "EX" })
                );
                mockPrisma.vehicle.create.mockResolvedValue({ id: vehicleId });
 
                await service.createVehicle({ userId, vin, year: 2003 });
 
                expect(mockedAxios.get).toHaveBeenCalledWith(
                    `https://vpic.nhtsa.dot.gov/api/vehicles/decodeVin/${vin}?format=json&modelyear=2003`
                );
                expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                    data: {
                        userId,
                        vin,
                        year: 2003,
                        make: "HONDA",
                        model: "Accord",
                        trim: "EX"
                    }
                });
            });
 
            it("prefers decoded data over a make/model supplied alongside the VIN", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue(null);
                mockedAxios.get.mockResolvedValue(
                    nhtsaResponse({ Make: "HONDA", Model: "Accord", Trim: "EX" })
                );
                mockPrisma.vehicle.create.mockResolvedValue({});
 
                await service.createVehicle({
                    userId,
                    vin,
                    year: 2003,
                    make: "Ignored",
                    model: "Ignored"
                });
 
                expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        make: "HONDA",
                        model: "Accord"
                    })
                });
            });
 
            it("stores trim as null when the decoder returns no trim", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue(null);
                mockedAxios.get.mockResolvedValue(
                    nhtsaResponse({ Make: "HONDA", Model: "Accord" })
                );
                mockPrisma.vehicle.create.mockResolvedValue({});
 
                await service.createVehicle({ userId, vin, year: 2003 });
 
                expect(mockPrisma.vehicle.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({ trim: null })
                });
            });
 
            it("propagates NHTSA API failures without creating a vehicle", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue(null);
                mockedAxios.get.mockRejectedValue(new Error("Network Error"));
 
                await expect(
                    service.createVehicle({ userId, vin, year: 2003 })
                ).rejects.toThrow("Network Error");
 
                expect(mockPrisma.vehicle.create).not.toHaveBeenCalled();
            });
 
            it("falls back to the manual path when year is missing (and fails without make/model)", async () => {
                mockPrisma.vehicle.findFirst.mockResolvedValue(null);
 
                await expect(
                    service.createVehicle({ userId, vin })
                ).rejects.toThrow(
                    "Year, make, and model are required when VIN is not provided"
                );
 
                expect(mockedAxios.get).not.toHaveBeenCalled();
            });
        });
    });
 
    describe("deleteVehicle", () => {
        it("deletes the vehicle when it belongs to the user", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
            mockPrisma.vehicle.delete.mockResolvedValue({});
 
            const result = await service.deleteVehicle(userId, vehicleId);
 
            expect(result).toEqual({ message: "Vehicle Deleted Successfully" });
            expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
                where: { id: vehicleId, userId }
            });
            expect(mockPrisma.vehicle.delete).toHaveBeenCalledWith({
                where: { id: vehicleId }
            });
        });
 
        it("throws and does not delete when the vehicle is not found", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
 
            await expect(
                service.deleteVehicle(userId, vehicleId)
            ).rejects.toThrow("Vehicle not found");
 
            expect(mockPrisma.vehicle.delete).not.toHaveBeenCalled();
        });
    });
 
    describe("patchVehicle", () => {
        it("updates only the provided fields", async () => {
            const updated = { id: vehicleId, make: "Ford" };
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
            mockPrisma.vehicle.update.mockResolvedValue(updated);
 
            const result = await service.patchVehicle(userId, vehicleId, {
                make: "Ford"
            });
 
            expect(result).toEqual(updated);
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: { id: vehicleId, userId },
                data: { make: "Ford" }
            });
        });
 
        it("updates every field when all are provided", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
            mockPrisma.vehicle.update.mockResolvedValue({});
 
            await service.patchVehicle(userId, vehicleId, {
                year: 2021,
                make: "Ford",
                model: "F-150",
                trim: "XLT"
            });
 
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: { id: vehicleId, userId },
                data: { year: 2021, make: "Ford", model: "F-150", trim: "XLT" }
            });
        });
 
        it("allows trim to be cleared with null", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
            mockPrisma.vehicle.update.mockResolvedValue({});
 
            await service.patchVehicle(userId, vehicleId, { trim: null });
 
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: { id: vehicleId, userId },
                data: { trim: null }
            });
        });
 
        it("sends an empty data object when nothing is provided", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: vehicleId });
            mockPrisma.vehicle.update.mockResolvedValue({});
 
            await service.patchVehicle(userId, vehicleId, {});
 
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
                where: { id: vehicleId, userId },
                data: {}
            });
        });
 
        it("throws and does not update when the vehicle is not found", async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
 
            await expect(
                service.patchVehicle(userId, vehicleId, { make: "Ford" })
            ).rejects.toThrow("Vehicle not found");
 
            expect(mockPrisma.vehicle.update).not.toHaveBeenCalled();
        });
    });
});