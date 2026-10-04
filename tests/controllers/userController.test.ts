import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
} from "vitest";

import UserController from "../../src/controllers/user";

describe("UserController", () => {
  const mockUserService = {
    getUser: vi.fn(),
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

  describe("getUser", () => {
    it("should return 401 when the user is not authenticated", async () => {
      const controller = new UserController(
        mockUserService as any
      );

      const req: any = {
        user: undefined,
      };

      const res = mockResponse();

      await controller.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        message: "Unauthorized",
      });

      expect(
        mockUserService.getUser
      ).not.toHaveBeenCalled();
    });

    it("should return the authenticated user", async () => {
      const user = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
      };

      mockUserService.getUser.mockResolvedValue(user);

      const controller = new UserController(
        mockUserService as any
      );

      const req: any = {
        user: {
          id: "user-123",
        },
      };

      const res = mockResponse();

      await controller.getUser(req, res);

      expect(
        mockUserService.getUser
      ).toHaveBeenCalledWith("user-123");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(user);
    });
  });
});