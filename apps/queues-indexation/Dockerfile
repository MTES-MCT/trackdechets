FROM node:24

WORKDIR /app

# This assumes you run the build command BEFORE docker build
COPY dist .

RUN npm install --omit=dev

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 trackdechets
USER trackdechets

CMD ["node", "main.js"]