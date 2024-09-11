const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf')
const token = "7022249930:AAFs1uPtpEtSzTQOO-Q0oZkqo3lyx1KcKAM"
const grouptoken = "2431537934"
const telegram = new Telegraf(token)

console.log('Starting bot...')

function createBot() {
    console.log('Creating bot...')
    
    const bot = mineflayer.createBot({
        host: "alvlp.aternos.me",
        port: "52346",
        username: "alvlp_nekomimi",
        //version: false
    })
    
    bot.on('chat', (username, message) => {
        if (username === bot.username) return
        console.log(`Chat received from ${username}: ${message}`)
        switch (message) {
            case ';start':
                console.log('Bot start command received')
                bot.chat('&l&fServer > &a&lBot started!')
                bot.setControlState('forward', true)
                bot.setControlState('jump', true)
                bot.setControlState('sprint', true)
                break
            case ';stop':
                console.log('Bot stop command received')
                bot.chat('Server Bot Stopped!')
                bot.clearControlStates()
                break
        }
    })

    bot.on('spawn', function() {
        console.log('Bot spawned')
        bot.chat('Server > Bot Spawned')
    })

    bot.on('death', function() {
        console.log('Bot died, respawning')
        bot.chat('Bot > I died, respawn')
    })

    bot.on('kicked', (reason, loggedIn) => {
        console.log(`Bot kicked: ${reason}, logged in: ${loggedIn}`)
    })

    bot.on('error', (err) => {
        console.log(`Bot error: ${err}`)
    })

    bot.on('end', () => {
        console.log('Bot disconnected, restarting...')
        createBot()
    })

    //Tele
    telegram.on('text', async (ctx) => {
        // Check if message was received from chosen group
        if (ctx.update.message.chat.id.toString() === grouptoken) {
            console.log('Message from Telegram group received')
            // Send message to MC server
            bot.chat(`${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}: ${ctx.update.message.text}`)
        }
    })

    // Redirect in-game messages to telegram group
    bot.on('chat', (username, message) => {
        if (username === bot.username) return
        console.log(`Redirecting chat to Telegram group: ${username}: ${message}`)
        telegram.telegram.sendMessage(grouptoken, username + ': ' + message)
    })
    */
}

createBot()
