require('dotenv').config();
const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');
const mineflayerViewer = require('prismarine-viewer').mineflayer;

const token = process.env.TOKEN;
const grouptoken = process.env.GROUP_ID;
const username = process.env.USERNAME;

const telegram = new Telegraf(token);

let bot; // Declare bot outside to access in different scopes
let initTimeout;

function createBot() {
    console.log('Initializing...');

    // Start the bot
    bot = mineflayer.createBot({
        host: "alvlp.aternos.me",
        port: "52346",
        username: "nekonux_bot",
    });

    // Set a timeout to restart the bot if initialization takes more than 10 seconds
    initTimeout = setTimeout(() => {
        console.log('Initialization took too long, restarting bot...');
        bot.end(); // End the bot connection if it is still initializing
        createBot();
    }, 20000); // 10 seconds

    // Redirect in-game messages to Telegram group
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`[SERVER] ${username} ${message}`);
        telegram.telegram.sendMessage(grouptoken, username + ': ' + message);
    });

    // Command handling
    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`[SERVER] ${username} ${message}`);
        switch (message) {
            case ';start':
                console.log('[CMD] Bot Start command received');
                bot.chat('&l&c[SERVER] &a&lBot Started!');
                bot.setControlState('forward', true);
                bot.setControlState('jump', true);
                bot.setControlState('sprint', true);
                break;
            case ';stop':
                console.log('Bot stop command received');
                bot.chat('Server Bot Stopped!');
                bot.clearControlStates();
                break;
        }
    });

    bot.on('spawn', function () {
        console.log('[BOT] Bot spawned');
        clearTimeout(initTimeout); // Clear the timeout when the bot spawns successfully
        bot.chat('&a&lBot Connected');
        bot.chat('&l&c[SERVER] &a&lBot Started!');
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);
        bot.setControlState('sprint', true);
    });

    bot.on('death', function () {
        console.log('Bot died, respawning');
        bot.chat('&l&c I died, respawn');
    });

    bot.on('kicked', (reason, loggedIn) => {
        console.log(`Bot kicked: ${reason}, logged in: ${loggedIn}`);
        createBot();
    });

    bot.on('error', (err) => {
        console.log(`Bot error: ${err}`);
    });

    bot.on('end', () => {
        console.log('Bot disconnected, restarting...');
        createBot();
    });
}

console.log('Starting bot...');
telegram.on('text', async (ctx) => {
    if (ctx.update.message.chat.id.toString() === grouptoken) {
        console.log(`[TELE] ${ctx.update.message.from.first_name}: ${ctx.update.message.text}`);
        bot.chat(`${ctx.update.message.from.first_name}: ${ctx.update.message.text}`);
    }
});

createBot();
telegram.launch();
