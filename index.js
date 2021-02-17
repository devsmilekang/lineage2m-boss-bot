const Discord = require("discord.js");
const client = new Discord.Client();
import DISCORD_TOKEN from "./config/token.config";
import { disposeMessage } from "./disposeMessage";
import node_schedule from "./node-scheduler";

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {
  await disposeMessage(msg);
});
client.login(DISCORD_TOKEN.token);
node_schedule(client);
