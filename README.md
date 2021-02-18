# 보스 타임 봇

현재는 리니지2m의 보스타임 체크를 기준으로 만들어 졌으며 디스코드를 통해 혈원들에게 알림을 준다.

추후 비슷한 형태의 게임 또는 사용할 수 있는 곳에서 config/boss.config.js 만 바꾸어주면 사용가능하다.

## Installation

```bash
npm i
```

```bash
mkdir boss
```

```bash
vi ./config/token.config.js
를 하여 discord bot token 삽입
```

## 실행법 Docker 사용

```bash
docker volume create boss-bot
docker build -f Dockerfile -t  boss-bot .
sudo docker run -itd -v boss-bot:/usr/src/app/boss --name boss-bot boss-bot
```
