FROM nginx:alpine

WORKDIR /usr/share/nginx/html
EXPOSE 80 443
COPY . .
ARG BASE_API_URL
RUN sed -i "s,BASE_URL_PLACEHOLDER,$BASE_API_URL,g" config.js