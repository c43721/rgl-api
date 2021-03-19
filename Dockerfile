FROM buildkite/puppeteer

WORKDIR /opt/app

COPY package.json .
COPY yarn.lock .
COPY . .

RUN yarn

RUN ["yarn", "build"]

CMD ["yarn", "start:prod"]