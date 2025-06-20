# build
FROM node:22-alpine

COPY . /app
WORKDIR /app
RUN npm install && npm run build

# serve
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

EXPOSE 80
