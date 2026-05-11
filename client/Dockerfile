FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

ARG VITE_MAP_TILE_LAYER_URL
ENV VITE_MAP_TILE_LAYER_URL=$VITE_MAP_TILE_LAYER_URL

EXPOSE 5173

CMD [ "npm", "run", "dev", "--", "--host" ]




