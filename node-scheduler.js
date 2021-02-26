import schedule from "node-schedule";
import fs from "fs";
import { noGenBoss, readBossTime } from "./disposeMessage";
import BOSS_CONFIG from "./config/boss.config";

module.exports = (client) => {
  schedule.scheduleJob("*/1 * * * *", async function () {
    await autoSkipTime(client);
    await noticeBoss({ client, minute: -5 });
    await noticeBoss({ client, minute: -1 });
  });
};

// 보스 미리 알림 기능
const noticeBoss = async ({ client, minute }) => {
  fs.readdir(`./boss/`, async (err, files) => {
    for (let fileName of files) {
      const boss = JSON.parse(fs.readFileSync(`./boss/${fileName}`));
      const noticeBoss = pickTimeBoss({ boss, minutesGap: minute });

      if (noticeBoss.length > 0) {
        const channelId = fileName.replace(".json", "");
        client.channels.cache.get(channelId).send(
          `${noticeBoss.map((item) => item.name).join(",")} ${
            minute * -1
          }분 전 입니다.`
          // { tts: minute * -1 === 1 ? true : false }
        );
        if (minute * -1 === 1 || minute * -1 === 5) {
          await sendAudio({
            client,
            channelId,
            noticeBoss: BOSS_CONFIG.filter(
              (item) => item.id === noticeBoss[0].id
            )[0],
            minute: minute * -1,
          });
        }
      }
    }
  });
};

const sendAudio = async ({ client, channelId, noticeBoss, minute }) => {
  const channelInfo = await client.channels.cache.get(channelId);

  const voiceChannelId = channelInfo.guild.channels.cache
    .filter((c) => c.type === "voice")
    .map((c) => c.id)[0];

  const connection = await client.channels.cache.get(voiceChannelId).join();
  console.log(noticeBoss);
  const dispatcher = connection.play(
    noticeBoss.audioUrl
      ? `${noticeBoss.audioUrl}_0${minute}.mp3`
      : `./audio/before_${minute}_minute.mp3`
  );
  console.log(
    noticeBoss.audioUrl
      ? `${noticeBoss.audioUrl}_0${minute}.mp3`
      : `./audio/before_${minute}_minute.mp3`
  );

  dispatcher.on("start", () => {
    console.log("audio.mp3 is now playing!");
  });

  dispatcher.on("finish", () => {
    console.log("audio.mp3 has finished playing!");
  });

  // Always remember to handle errors appropriately!
  dispatcher.on("error", console.error);
};

// 5분이 지나면 자동 멍 처리 해준다
const autoSkipTime = async (client) => {
  fs.readdir(`./boss/`, async (err, files) => {
    for (let fileName of files) {
      const boss = JSON.parse(fs.readFileSync(`./boss/${fileName}`));
      const skipTimeBoss = pickTimeBoss({ boss, minutesGap: 5 });
      if (skipTimeBoss.length > 0) {
        skipTimeBoss &&
          skipTimeBoss.map((boss) => {
            noGenBoss({ boss, fileName });
          });
        const channelId = fileName.replace(".json", "");
        client.channels.cache
          .get(channelId)
          .send(
            `${skipTimeBoss
              .map((item) => item.name)
              .join(",")} 멍처리 되었습니다.`
          );
        client.channels.cache
          .get(channelId)
          .send(await readBossTime({ fileName, boss: skipTimeBoss }));
      }
    }
  });
};

// timeGap 시간에 맞춰 알맞는 보스를 돌려준다.
const pickTimeBoss = ({ boss, minutesGap }) => {
  return (
    boss &&
    boss.filter((item) => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - minutesGap);
      return parseInt(item.genTime) === now.getHours() * 100 + now.getMinutes();
    })
  );
};
