FROM node:0.10-onbuild

MAINTAINER Adam Coomes

EXPOSE 1337

RUN npm install -g sails

RUN sails lift