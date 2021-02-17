FROM node:12

RUN npm install -g nodemon
#RUN npm install -g yarn

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# TimeZone 설정
ENV TZ Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime

CMD [ "npm", "run", "build" ]