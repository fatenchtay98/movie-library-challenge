FROM node:20-alpine AS build
WORKDIR /app
# Vite inlines VITE_* vars at build time, so this has to be a build arg, not a
# runtime env var — the nginx stage below serves static, already-built files.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
