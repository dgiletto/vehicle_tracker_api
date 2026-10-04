import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";

const { mockPrisma } = vi.hoisted(() => {
    return {
        mockPrisma: {
            user: {
                findUnique: vi.fn(),
                create: vi.fn()
            },
        }
    };
});

vi.mock("../../src/config/prisma", () => ({
  default: mockPrisma,
}));

import AuthService from "../../src/services/auth";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe("registerUser", () => {
    it("should register a user successfully", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const newUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        firstName: "John",
        lastName: "Doe",
      };

      mockPrisma.user.create.mockResolvedValue(newUser);

      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("salt" as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue(
        "hashed-password" as never
      );

      const result = await authService.registerUser({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
        },
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed-password",
          firstName: "John",
          lastName: "Doe",
        },
      });

      expect(result).toEqual(newUser);
    });

    it("should register a user without first or last name", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        firstName: null,
        lastName: null,
      });

      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("salt" as never);
      vi.spyOn(bcrypt, "hash").mockResolvedValue(
        "hashed-password" as never
      );

      await authService.registerUser({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed-password",
          firstName: null,
          lastName: null,
        },
      });
    });

    it("should throw an error when the email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
      });

      await expect(
        authService.registerUser({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Email already exists");

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("should hash the password before creating the user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      });

      vi.spyOn(bcrypt, "genSalt").mockResolvedValue("salt" as never);

      const hashSpy = vi
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashed-password" as never);

      await authService.registerUser({
        email: "test@example.com",
        password: "password123",
      });

      expect(hashSpy).toHaveBeenCalledWith(
        "password123",
        "salt"
      );
    });

    it("should use a salt when hashing the password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      mockPrisma.user.create.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      });

      const saltSpy = vi
        .spyOn(bcrypt, "genSalt")
        .mockResolvedValue("salt" as never);

      vi.spyOn(bcrypt, "hash").mockResolvedValue(
        "hashed-password" as never
      );

      await authService.registerUser({
        email: "test@example.com",
        password: "password123",
      });

      expect(saltSpy).toHaveBeenCalledWith(10);
    });
  });

  describe("loginUser", () => {
    it("should login successfully with valid credentials", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        firstName: "John",
        lastName: "Doe",
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);

      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const result = await authService.loginUser({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "test@example.com",
        },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );

      expect(result).toEqual(user);
    });

    it("should throw an error when the user does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginUser({
          email: "missing@example.com",
          password: "password123",
        })
      ).rejects.toThrow("User not found");

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw an error when the password is incorrect", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      });

      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      await expect(
        authService.loginUser({
          email: "test@example.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("Invalid Password");
    });
  });
});
