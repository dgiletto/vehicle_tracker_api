FROM node:22-alpine 

WORKDIR /app 

COPY package*.json ./ 

RUN npm ci 

COPY prisma ./prisma 
COPY prisma7.config.ts ./ 
COPY src ./src 
COPY tsconfig.json ./ 

EXPOSE 5000 

CMD ["sh", "-c", "npx prisma generate && npm run dev"]
