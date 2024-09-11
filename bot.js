const mineflayer = require('mineflayer');

console.log('Starting...')

function createBot () {
    const bot = mineflayer.createBot({
    host: "alvlp.aternos.me",
    port: "52346",
    username: "alvlp_bot",
    //version: false
    })
    bot.on('chat', (username, message) => {
      if (username === bot.username) return
      switch (message) {
        case ';start':
          bot.chat('&l&fServer > &a&lBot started!')
          bot.setControlState('forward', true)
          bot.setControlState('jump', true)
          bot.setControlState('sprint', true)
          break
          case ';stop':
            bot.chat('Server Bot Stopeed!')
            bot.clearControlStates()
            break
          }
        })
        bot.on('spawn', function() {
          bot.chat('Server > Bot Spawned')
        })
        bot.on('death', function() {
          bot.chat('Bot > I died, respawn')
        })
        bot.on('kicked', (reason, loggedIn) => console.log(reason, loggedIn))
        bot.on('error', err => console.log(err))
        bot.on('end', createBot)
}
createBot()