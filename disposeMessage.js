import fs from "fs";
import BOSS_CONFIG from "./config/boss.config";

export const disposeMessage = async (msg) => {
  const prefix = "!"; // 명령어 구분자
  let { content, channel } = msg;
  if (
    content[0] === prefix ||
    content === `보스` ||
    content === `ㅄ` ||
    content === `ㅂㅅ`
  ) {
    if (
      content === `${prefix}보스` ||
      content === `보스` ||
      content === `ㅄ` ||
      content === `ㅂㅅ`
    ) {
      // 보스 시간 확인 명령어
      channel.send(await readBossTime({ fileName: `${channel.id}.json` }));
    } else if (content.trim().split(" ")[0] === `${prefix}메모`) {
      // !메모 보스명 메모내용
      // 디스코드 명령어
      const splitMessage = content.trim().split(" ");
      const boss = findBoss(splitMessage[1]);
      if (boss) {
        await writeMemo({
          msg: splitMessage.slice(2).join(" "),
          fileName: `${channel.id}.json`,
          boss,
          channel,
        });
        channel.send(await readBossTime({ fileName: `${channel.id}.json` }));
      } else {
        channel.send("메모 할 보스가 없습니다.");
      }
    } else if (content === `${prefix}초기화`) {
      // 보스 초기화
      await resetFile({ channel });
    } else if (content.trim().split(" ")[0] === `${prefix}삭제`) {
      // 특정보스 삭제
      const boss = findBoss(content.trim().split(" ")[1]);
      if (boss) {
        await deleteBoss({ channel, boss, fileName: `${channel.id}.json` });
        channel.send(await readBossTime({ fileName: `${channel.id}.json` }));
      }
    } else if (content === `${prefix}명령어`) {
      // 디스코드 명령어
      await sendCommandList({ channel });
    } else if (content === `${prefix}입력가능보스`) {
      channel.send(await readBossList());
    }
  } else {
    const splitMessage = content.trim().split(" ");
    if (splitMessage.length === 2) {
      if (!isNaN(parseInt(splitMessage[0]))) {
        // 보스 시간 직접 적기
        // 맨 앞이 숫자인지 체크
        const boss = findBoss(splitMessage[1]);
        if (boss) {
          await writeBossTime({
            boss: boss,
            fileName: `${channel.id}.json`,
            genTime: splitMessage[0].toString().padStart(4, "0"),
          });
          channel.send(await readBossTime({ fileName: `${channel.id}.json` }));
        } else {
          channel.send("보스가 없습니다.");
        }
      } else {
        if (splitMessage[1] === "컷" || splitMessage[1] === "ㅋ") {
          // 보스 컷 적기
          const boss = findBoss(splitMessage[0]);
          if (boss) {
            await cutBossTime({
              boss: boss,
              fileName: `${channel.id}.json`,
              cutTime:
                new Date().getHours().toString().padStart(2, "0") +
                new Date().getMinutes().toString().padStart(2, "0"),
            });
            channel.send(
              await readBossTime({ fileName: `${channel.id}.json` })
            );
          }
        } else if (splitMessage[1] === "멍" || splitMessage[1] === "ㅁ") {
          const boss = findBoss(splitMessage[0]);
          if (boss) {
            await noGenBoss({
              boss,
              fileName: `${channel.id}.json`,
            });
            channel.send(
              await readBossTime({ fileName: `${channel.id}.json` })
            );
          }
        }
      }
    }
  }
};

// 보스시간 초기화
const resetFile = async ({ channel }) => {
  if (fs.existsSync(`./boss/${channel.id}.json`)) {
    fs.unlink(`./boss/${channel.id}.json`, function () {});
  }
};

//입력된 보스와 같은 보스를 삭제한다.
const deleteBoss = async ({ channel, boss, fileName }) => {
  if (fs.existsSync(`./boss/${fileName}`)) {
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    if (fileBoss.find((item) => item.id === boss.id)) {
      console.log(fileBoss.filter((item) => item.id !== boss.id));
      fs.writeFileSync(
        `./boss/${fileName}`,
        JSON.stringify(
          sortByTime(fileBoss.filter((item) => item.id !== boss.id))
        )
      );
    } else {
      channel.send(`기존의 ${boss.name}이 존재하지 않습니다.`);
    }
  }
};

// 보스 기타사항 메모
const writeMemo = async ({ channel, msg, boss, fileName }) => {
  if (fs.existsSync(`./boss/${fileName}`)) {
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    if (fileBoss.find((item) => item.id === boss.id)) {
      fileBoss &&
        fileBoss.map((item) => {
          if (item.id === boss.id) {
            item.memo = msg;
          }
        });
      fs.writeFileSync(
        `./boss/${fileName}`,
        JSON.stringify(sortByTime(fileBoss))
      );
    } else {
      channel.send(`기존의 ${boss.name}이 존재하지 않습니다.`);
    }
  }
};

//컷 시간으로 보스 시간 등록
const cutBossTime = async ({ boss, fileName, cutTime }) => {
  if (!fs.existsSync(`./boss/${fileName}`)) {
    // 파일이 없을 떄 파일 생성
    boss.genTime = calGenTime({ boss: boss, cutTime: cutTime });
    fs.writeFileSync(`./boss/${fileName}`, JSON.stringify([boss]));
  } else {
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    if (fileBoss.find((item) => item.id === boss.id)) {
      fileBoss &&
        fileBoss.map((item) => {
          if (item.id === boss.id) {
            item.genTime = calGenTime({ boss: boss, cutTime: cutTime });
            item.mungCount = 0;
          }
        });
    } else {
      boss.genTime = calGenTime({ boss: boss, cutTime: cutTime });
      fileBoss.push(boss);
    }
    fs.writeFileSync(
      `./boss/${fileName}`,
      JSON.stringify(sortByTime(fileBoss))
    );
  }
};
//멍으로 보스 타임 넘김
export const noGenBoss = async ({ boss, fileName }) => {
  if (fs.existsSync(`./boss/${fileName}`)) {
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    if (fileBoss.find((item) => item.id === boss.id)) {
      fileBoss &&
        fileBoss.map((item) => {
          if (item.id === boss.id) {
            item.genTime = calGenTime({ boss: boss, cutTime: item.genTime });
            item.mungCount = item.mungCount ? item.mungCount + 1 : 1;
          }
        });
      fs.writeFileSync(
        `./boss/${fileName}`,
        JSON.stringify(sortByTime(fileBoss))
      );
    } else {
      channel.send(`기존의 ${boss.name}이 존재하지 않습니다.`);
    }
  }
};

// 다음 보스 젠 시간 계산
const calGenTime = ({ boss, cutTime }) => {
  const hour = parseInt(cutTime.slice(0, 2));
  return hour + boss.time >= 24
    ? (hour + boss.time - 24).toString().padStart(2, "0") + cutTime.slice(2)
    : (hour + boss.time).toString().padStart(2, "0") + cutTime.slice(2);
};

//사용자가 입력한 보스시간 삽입
const writeBossTime = async ({ boss, fileName, genTime }) => {
  if (!fs.existsSync(`./boss/${fileName}`)) {
    // 파일이 없을 떄 파일 생성
    boss.genTime = genTime;
    fs.writeFileSync(`./boss/${fileName}`, JSON.stringify([boss]));
  } else {
    // 파일이 있으면 기존의 내역을 가져와서 수정
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    if (fileBoss.find((item) => item.id === boss.id)) {
      fileBoss &&
        fileBoss.map((item) => {
          if (item.id === boss.id) {
            item.genTime = genTime;
            item.mungCount = 0;
          }
        });
    } else {
      boss.genTime = genTime;
      fileBoss.push(boss);
    }

    fs.writeFileSync(
      `./boss/${fileName}`,
      JSON.stringify(sortByTime(fileBoss))
    );
  }
};

// 보스시간 읽고 알림
export const readBossTime = async ({ fileName }) => {
  if (!fs.existsSync(`./boss/${fileName}`)) {
    return "보스 시간이 존재하지 않습니다.";
  } else {
    const file = fs.readFileSync(`./boss/${fileName}`, {
      encoding: "utf-8",
    });
    const fileBoss = JSON.parse(file);
    let sendMessage = "```";
    fileBoss &&
      fileBoss.map((item) => {
        sendMessage += `
${item.genTime} ${item.name}${
          item.mungCount > 0 ? ` (${item.mungCount}회 멍처리)` : ""
        }${item.memo ? ` ${item.memo}` : ""}`;
      });
    sendMessage += "```";
    return fileBoss ? sendMessage : "보스 시간이 없습니다.";
  }
};

// 입력가능한 보스 정보를 보여준다
export const readBossList = async () => {
  let message = "```";
  BOSS_CONFIG.map((item, index) => {
    message += `${index + 1}. 보스명 : ${item.name},  약자 : ${
      item.nameAbbreviation
    },  시간텀 : ${item.time}시간
`;
  });
  message += "```";
  return message;
};

// 보스 getTime에 맞춰 정렬
const sortByTime = (bosses) => {
  return (
    bosses &&
    bosses.sort((prev, next) => {
      const now = new Date().getHours() * 100 + new Date().getMinutes();
      // 현재 시간을 genTime에서 빼서 -이면 24시간을 추가해줌 (지난 시간이므로 )
      const prevGenTime =
        now > parseInt(prev.genTime)
          ? parseInt(prev.genTime) + 2400
          : parseInt(prev.genTime);
      const nextGenTime =
        now > parseInt(next.genTime)
          ? parseInt(next.genTime) + 2400
          : parseInt(next.genTime);
      return prevGenTime - nextGenTime;
    })
  );
};

// 채널에 명령어 보내주기
const sendCommandList = async ({ channel }) => {
  let message = "```";
  message += fs.readFileSync(`./config/commandList.txt`);
  message += "```";
  channel.send(message);
};

//입력과 일치하는 보스 찾기
const findBoss = (inputBoss) => {
  return BOSS_CONFIG.find(
    (value) => inputBoss === value.name || inputBoss === value.nameAbbreviation
  );
};
