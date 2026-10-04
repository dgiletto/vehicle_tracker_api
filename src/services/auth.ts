import bcrypt from "bcryptjs";
import prisma from "../config/prisma";

interface RegisterUserData {
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
}

interface LoginUserData {
    email: string,
    password: string
}

class AuthService {
    registerUser = async ({email, password, firstName, lastName}: RegisterUserData) => {
        const existingEmail = await prisma.user.findUnique({
            where : { email: email }
        });

        if (existingEmail) {
            throw new Error("Email already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const first = firstName ? firstName : null;
        const last = lastName ? lastName : null;

        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                firstName: first,
                lastName: last
            }
        });

        return newUser;
    }

    loginUser = async ({email, password}: LoginUserData) => {
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            throw new Error("User not found");
        }

        const isMatch: boolean = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new Error("Invalid Password");
        }

        return user;
    }
}

export default AuthService;