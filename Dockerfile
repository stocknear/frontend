FROM node:20-alpine

WORKDIR /stocknear-frontend

COPY . .
RUN npm install

CMD ["npm", "run", "dev"]