FROM node:22-alpine

WORKDIR /app/server

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD [ "npm", "run", "dev", "--", "--host" ]




