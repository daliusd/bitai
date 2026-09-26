FROM node:22-alpine AS build
WORKDIR /app
COPY apps/cholesterolis/package.json apps/cholesterolis/package-lock.json ./
RUN npm ci
COPY apps/cholesterolis/ ./
RUN npx vitest run && npm run build

FROM nginx:alpine-slim AS production
COPY . /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/apps
COPY --from=build /app/dist /usr/share/nginx/html/cholesterolis
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
