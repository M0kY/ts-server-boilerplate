FROM node:10-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=4000
ENV PORT $PORT
EXPOSE $PORT

RUN apk --no-cache add --virtual builds-deps build-base python
RUN npm i npm@latest -g

RUN mkdir /node_app && chown node:node /node_app
WORKDIR /node_app

USER node
COPY package*.json ./
RUN npm i && npm cache clean --force
ENV PATH /node_app/node_modules/.bin:$PATH

WORKDIR /node_app/app

COPY . .

CMD [ "node", "./dist/index.js" ]
