FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY . .

EXPOSE 8080

CMD ["node", "src/index.js"]
