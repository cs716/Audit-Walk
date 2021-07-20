FROM alpine:latest
WORKDIR /opt/node_app

RUN apk add --update nodejs npm

COPY package.json package-lock.json* ./
RUN npm install --no-optional && npm cache clean --force

ENV PATH /opt/node_app/node_modules/.bin:$PATH 

WORKDIR /opt/node_app/app
COPY . .

CMD node /opt/node_app/app/bin/www