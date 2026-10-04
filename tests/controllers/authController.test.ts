import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";

import AuthController from "../../src/controllers/auth";

describe("AuthController", () => {
  const mockAuthService = {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
  };

  const mockResponse = () => {
    const res: any = {};

    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.cookie = vi.fn().mockReturnValue(res);
    res.clearCookie = vi.fn().mockReturnValue(res);

    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should return 400 when credentials are missing", async () => {
      const controller = new AuthController(
        mockAuthService as any
      );

      const req: any = {
        body: {
          username: "testuser",
          email: "test@example.com",
        },
      };

      const res = mockResponse();

      await controller.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: "Missing credentials",
      });

      expect(
        mockAuthService.registerUser
      ).not.toHaveBeenCalled();
    });

    it("should register a user successfully", async () => {
      mockAuthService.registerUser.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
      });

      const controller = new AuthController(
        mockAuthService as any
      );

      const req: any = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      const res = mockResponse();

      await controller.registerUser(req, res);

      expect(
        mockAuthService.registerUser
      ).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        message: "User created successfully",
      });
    });
  });

  describe("loginUser", () => {
    it("should return 400 when credentials are missing", async () => {
      const controller = new AuthController(
        mockAuthService as any
      );

      const req: any = {
        body: {
          identifier: "test@example.com",
        },
      };

      const res = mockResponse();

      await controller.loginUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        message: "Missing credentials",
      });

      expect(
        mockAuthService.loginUser
      ).not.toHaveBeenCalled();
    });
  });
});