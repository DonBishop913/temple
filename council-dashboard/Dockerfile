FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
RUN apk add --no-cache curl
COPY . .
ENV PORT=4321
EXPOSE 4321 4322
CMD ["npm", "start"]