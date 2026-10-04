import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            user: {
                findUnique: vi.fn(),
            },
        }
    };
});

vi.mock("../../src/config/prisma", () => ({
  default: mockPrisma,
}));

import UserService from "../../src/services/user";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  describe("getUser", () => {
    it("should return the user", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUser("user-123");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: "user-123",
        },
        select: {
          id: true,
          email: true,
        },
      });

      expect(result).toEqual(user);
    });

    it("should throw an error when the user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        userService.getUser("missing-user")
      ).rejects.toThrow("User not found");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: "missing-user",
        },
        select: {
          id: true,
          email: true,
        },
      });
    });
  });
});
