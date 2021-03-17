FROM buildkite/puppeteer

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN ["yarn", "build"]

CMD ["yarn", "start:prod"]