# The web app as a Node server (adapter-node). Settings at run time:
#   FHIR_API_URL  where the FHIR API is, e.g. http://api:8000
#   ORIGIN        the address people open the app at, e.g. http://localhost:3000
#                 (SvelteKit checks form posts against it)
#   PORT          where to listen (default 3000)

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# The build bundles every dependency, so only it and package.json are needed to run.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build /app/build ./build
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "build"]
