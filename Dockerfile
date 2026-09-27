FROM node:22-alpine AS cholesterolis
WORKDIR /app
COPY apps/cholesterolis/package.json apps/cholesterolis/package-lock.json ./
RUN npm ci
COPY apps/cholesterolis/ ./
RUN npx vitest run && npm run build

FROM node:22-alpine AS kraujospudis
WORKDIR /app
COPY apps/kraujospudis/package.json apps/kraujospudis/package-lock.json ./
RUN npm ci
COPY apps/kraujospudis/ ./
RUN npx vitest run && npm run build

FROM node:22-alpine AS laikmatis
WORKDIR /app
COPY apps/laikmatis/package.json apps/laikmatis/package-lock.json ./
RUN npm ci
COPY apps/laikmatis/ ./
RUN npx vitest run && npm run build

FROM nginx:alpine-slim AS production
COPY . /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/apps
COPY --from=cholesterolis /app/dist /usr/share/nginx/html/cholesterolis
COPY --from=kraujospudis /app/dist /usr/share/nginx/html/kraujospudis
COPY --from=laikmatis /app/dist /usr/share/nginx/html/laikmatis
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
