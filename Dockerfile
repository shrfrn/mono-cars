FROM node:22-alpine
WORKDIR /app

#Copy the root workspace config
COPY package*.json ./

#Copy the typescript config
COPY tsconfig*.json ./

#Copy the shared package FIRST
COPY packages/shared ./packages/shared

#Copy the backend app
COPY apps/backend ./apps/backend

#Install everything from the root
RUN npm install

#Tell Docker to run from the backend folder
WORKDIR /app/apps/backend
EXPOSE 3030
CMD ["npm", "run", "dev"]