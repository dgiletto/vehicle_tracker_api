import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";

import VehicleController from "../../src/controllers/vehicle";
import { errorHandler } from "../../src/utils/errorHandler";

vi.mock("../../src/utils/errorHandler", () => ({
  errorHandler: vi.fn(),
}));

describe("VehicleController", () => {
  const mockVehicleService = {
    createVehicle: vi.fn(),
    getVehicle: vi.fn(),
    getVehicles: vi.fn(),
    patchVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
  };

  const mockResponse = () => {
    const res: any = {};

    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);

    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVehicle", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
        body: {
          vin: "VIN123",
          year: 2020,
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockVehicleService.createVehicle
      ).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty body", {}],
      ["a VIN without a year", { vin: "VIN123" }],
      ["only a year", { year: 2020 }],
      ["a year and make without a model", { year: 2020, make: "Honda" }],
      ["a year and model without a make", { year: 2020, model: "Civic" }],
      ["make and model without a year", { make: "Honda", model: "Civic" }],
      [
        "VIN, make, and model without a year",
        { vin: "VIN123", make: "Honda", model: "Civic" },
      ],
    ])("should return 400 for %s", async (_label, body) => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body,
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message:
          "Provide a VIN and year or enter the vehicle's year, make, and model",
      });

      expect(
        mockVehicleService.createVehicle
      ).not.toHaveBeenCalled();
    });

    it("should create a vehicle from a VIN and year", async () => {
      const vehicle = {
        id: "vehicle-123",
        vin: "VIN123",
        year: 2020,
      };

      mockVehicleService.createVehicle.mockResolvedValue(vehicle);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body: {
          vin: "VIN123",
          year: 2020,
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(
        mockVehicleService.createVehicle
      ).toHaveBeenCalledWith({
        userId: "user-123",
        vin: "VIN123",
        year: 2020,
      });

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        message: "Vehicle created successfully",
        data: vehicle,
      });
    });

    it("should create a vehicle from year, make, model, and trim", async () => {
      mockVehicleService.createVehicle.mockResolvedValue({
        id: "vehicle-123",
      });

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body: {
          year: 2020,
          make: "Honda",
          model: "Civic",
          trim: "Sport",
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(
        mockVehicleService.createVehicle
      ).toHaveBeenCalledWith({
        userId: "user-123",
        year: 2020,
        make: "Honda",
        model: "Civic",
        trim: "Sport",
      });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should only forward whitelisted fields to the service", async () => {
      mockVehicleService.createVehicle.mockResolvedValue({
        id: "vehicle-123",
      });

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body: {
          year: 2020,
          make: "Honda",
          model: "Civic",
          userId: "attacker",
          id: "forced-id",
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(
        mockVehicleService.createVehicle
      ).toHaveBeenCalledWith({
        userId: "user-123",
        year: 2020,
        make: "Honda",
        model: "Civic",
      });
    });

    it("should return 409 when the VIN already exists", async () => {
      mockVehicleService.createVehicle.mockRejectedValue(
        new Error("A vehicle with this VIN already exists for this user.")
      );

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body: {
          vin: "VIN123",
          year: 2020,
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        message: "A vehicle with this vin already exists",
      });

      expect(errorHandler).not.toHaveBeenCalled();
    });

    it("should delegate unexpected errors to errorHandler", async () => {
      const error = new Error("boom");

      mockVehicleService.createVehicle.mockRejectedValue(error);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        body: {
          vin: "VIN123",
          year: 2020,
        },
      };

      const res = mockResponse();

      await controller.createVehicle(req, res);

      expect(errorHandler).toHaveBeenCalledWith(res, error);

      expect(res.status).not.toHaveBeenCalledWith(201);
    });
  });

  describe("getVehicle", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.getVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockVehicleService.getVehicle
      ).not.toHaveBeenCalled();
    });

    it("should return 400 when the vehicle id is missing", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: {},
      };

      const res = mockResponse();

      await controller.getVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: "Vehicle ID is required",
      });

      expect(
        mockVehicleService.getVehicle
      ).not.toHaveBeenCalled();
    });

    it("should return the vehicle", async () => {
      const vehicle = {
        id: "vehicle-123",
        make: "Honda",
      };

      mockVehicleService.getVehicle.mockResolvedValue(vehicle);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.getVehicle(req, res);

      expect(
        mockVehicleService.getVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({ vehicle });
    });

    it("should use the first value when the vehicle id is an array", async () => {
      mockVehicleService.getVehicle.mockResolvedValue({
        id: "vehicle-123",
      });

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: ["vehicle-123", "vehicle-456"] },
      };

      const res = mockResponse();

      await controller.getVehicle(req, res);

      expect(
        mockVehicleService.getVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123");
    });

    it("should delegate service errors to errorHandler", async () => {
      const error = new Error("Vehicle not found");

      mockVehicleService.getVehicle.mockRejectedValue(error);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.getVehicle(req, res);

      expect(errorHandler).toHaveBeenCalledWith(res, error);
    });
  });

  describe("getVehicles", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
      };

      const res = mockResponse();

      await controller.getVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockVehicleService.getVehicles
      ).not.toHaveBeenCalled();
    });

    it("should return the vehicles with a count", async () => {
      const vehicles = [
        { id: "vehicle-1" },
        { id: "vehicle-2" },
      ];

      mockVehicleService.getVehicles.mockResolvedValue(vehicles);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
      };

      const res = mockResponse();

      await controller.getVehicles(req, res);

      expect(
        mockVehicleService.getVehicles
      ).toHaveBeenCalledWith("user-123");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        count: 2,
        vehicles,
      });
    });

    it("should return an undefined count and null vehicles when the user has none", async () => {
      mockVehicleService.getVehicles.mockResolvedValue(null);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
      };

      const res = mockResponse();

      await controller.getVehicles(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        count: undefined,
        vehicles: null,
      });
    });

    it("should delegate service errors to errorHandler", async () => {
      const error = new Error("db down");

      mockVehicleService.getVehicles.mockRejectedValue(error);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
      };

      const res = mockResponse();

      await controller.getVehicles(req, res);

      expect(errorHandler).toHaveBeenCalledWith(res, error);
    });
  });

  describe("patchVehicle", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
        params: { vehicleId: "vehicle-123" },
        body: { make: "Ford" },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockVehicleService.patchVehicle
      ).not.toHaveBeenCalled();
    });

    it("should return 400 when the vehicle id is missing", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: {},
        body: { make: "Ford" },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: "Vehicle Id is required",
      });

      expect(
        mockVehicleService.patchVehicle
      ).not.toHaveBeenCalled();
    });

    it("should pass only the provided fields to the service", async () => {
      const updatedVehicle = {
        id: "vehicle-123",
        make: "Ford",
      };

      mockVehicleService.patchVehicle.mockResolvedValue(
        updatedVehicle
      );

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
        body: { make: "Ford" },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(
        mockVehicleService.patchVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123", {
        make: "Ford",
      });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(updatedVehicle);
    });

    it("should forward a null trim so it can be cleared", async () => {
      mockVehicleService.patchVehicle.mockResolvedValue({});

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
        body: { trim: null },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(
        mockVehicleService.patchVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123", {
        trim: null,
      });
    });

    it("should ignore the VIN and unknown fields in the body", async () => {
      mockVehicleService.patchVehicle.mockResolvedValue({});

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
        body: {
          vin: "NEWVIN",
          userId: "attacker",
          year: 2022,
        },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(
        mockVehicleService.patchVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123", {
        year: 2022,
      });
    });

    it("should use the first value when the vehicle id is an array", async () => {
      mockVehicleService.patchVehicle.mockResolvedValue({});

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: ["vehicle-123", "vehicle-456"] },
        body: { year: 2022 },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(
        mockVehicleService.patchVehicle
      ).toHaveBeenCalledWith(
        "user-123",
        "vehicle-123",
        expect.any(Object)
      );
    });

    it("should delegate service errors to errorHandler", async () => {
      const error = new Error("Vehicle not found");

      mockVehicleService.patchVehicle.mockRejectedValue(error);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
        body: { make: "Ford" },
      };

      const res = mockResponse();

      await controller.patchVehicle(req, res);

      expect(errorHandler).toHaveBeenCalledWith(res, error);
    });
  });

  describe("deleteVehicle", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockVehicleService.deleteVehicle
      ).not.toHaveBeenCalled();
    });

    it("should return 400 when the vehicle id is missing", async () => {
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: {},
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: "Vehicle Id is required",
      });

      expect(
        mockVehicleService.deleteVehicle
      ).not.toHaveBeenCalled();
    });

    it("should check the vehicle id before authentication", async () => {
      // Documents current behavior: with neither present, 400 wins over 401
      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: undefined,
        params: {},
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete the vehicle and return the service result", async () => {
      const result = {
        message: "Vehicle Deleted Successfully",
      };

      mockVehicleService.deleteVehicle.mockResolvedValue(result);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(
        mockVehicleService.deleteVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(result);
    });

    it("should use the first value when the vehicle id is an array", async () => {
      mockVehicleService.deleteVehicle.mockResolvedValue({});

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: ["vehicle-123", "vehicle-456"] },
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(
        mockVehicleService.deleteVehicle
      ).toHaveBeenCalledWith("user-123", "vehicle-123");
    });

    it("should delegate service errors to errorHandler", async () => {
      const error = new Error("Vehicle not found");

      mockVehicleService.deleteVehicle.mockRejectedValue(error);

      const controller = new VehicleController(
        mockVehicleService as any
      );

      const req: any = {
        user: { id: "user-123" },
        params: { vehicleId: "vehicle-123" },
      };

      const res = mockResponse();

      await controller.deleteVehicle(req, res);

      expect(errorHandler).toHaveBeenCalledWith(res, error);
    });
  });
});