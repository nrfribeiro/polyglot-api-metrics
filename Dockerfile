#############
# Build Image
#############
FROM amd64/node:15.14.0-alpine3.13  AS NODE_COMPILER
# Get dependencies for build
RUN apk --no-cache add curl bash
# install node-prune (https://github.com/tj/node-prune)
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin

# Prepare build
WORKDIR /usr/src/app
COPY package.json ./
COPY ./src/. ./src/.
COPY tsconfig.json ./
# Build and clean compiled
RUN npm install 

RUN npm run build && npm prune --production && /usr/local/bin/node-prune


#############
# Build OutImage
#############
FROM node:15.14.0-alpine3.13

WORKDIR /usr/src/app

COPY --from=NODE_COMPILER /usr/src/app/lib  ./lib
COPY --from=NODE_COMPILER /usr/src/app/node_modules/ ./node_modules/

EXPOSE 8080
USER node
CMD [ "node", "lib/." ]
