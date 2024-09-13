require('dotenv').config();
const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf');
const mineflayerViewer = require('prismarine-viewer').mineflayer;

const token = process.env.TOKEN;
const grouptoken = process.env.GROUP_ID;
const username = process.env.USERNAME;

const telegram = new Telegraf(token);

let bot;
let initTimeout;

function createBot() {
    console.log('Initializing...');

    bot = mineflayer.createBot({
        host: "alvlp.aternos.me",
        port: "52346",
        username: "nekonux_bot",
    });

    initTimeout = setTimeout(() => {
        console.log('Time out, restarting bot...');
        bot.end();
        createBot();
    }, 20000);

    bot.on('spawn', function () {
        clearTimeout(initTimeout);
        console.log('[BOT] Bot spawned');
        setInterval(() => {
            const entity = bot.nearestEntity()
            if (entity !== null) {
              if (entity.type === 'player') {
                bot.lookAt(entity.position.offset(0, 1.6, 0))
                bot.attack(entity)
              } else if (entity.type === 'mob') {
                bot.lookAt(entity.position)
                bot.attack(entity)
              }
            }
          }, 50)


        bot.chat('&a&lBot Connected');
        bot.chat('&l&c[SERVER] &a&lBot Started!');
        bot.setControlState('forward', true);
        bot.setControlState('jump', true);
        bot.setControlState('sprint', true);
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        console.log(`[SERVER] ${username} ${message}`);
        telegram.telegram.sendMessage(grouptoken, username + ': ' + message);
    });

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
            case ';sleep':
                goToSleep()
                break
            case ';wakeup':
                wakeUp()
                break
        }
    });

    bot.on('sleep', () => {
        bot.chat('Good night!')
      })
      bot.on('wake', () => {
        bot.chat('Good morning!')
      })

    async function goToSleep () {
    const bed = bot.findBlock({
        matching: block => bot.isABed(block)
    })
    if (bed) {
        try {
        await bot.sleep(bed)
        bot.chat("I'm sleeping")
        } catch (err) {
        bot.chat(`I can't sleep: ${err.message}`)
        }
    } else {
        bot.chat('No nearby bed')
    }
    }

    async function wakeUp () {
    try {
        await bot.wake()
    } catch (err) {
        bot.chat(`I can't wake up: ${err.message}`)
    }
    }

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
