FROM node:12-alpine AS build
WORKDIR /opt/app

COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn build

FROM buildkite/puppeteer
WORKDIR /opt/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package.json .
COPY yarn.lock .
RUN yarn --prod

COPY --from=build /opt/app/dist ./dist

USER node
CMD [ "yarn", "start:prod" ]
EXPOSE 8080