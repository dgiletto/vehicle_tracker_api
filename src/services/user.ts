import prisma from "../config/prisma";

class UserService {
    getUser = async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }
}

export default UserService;