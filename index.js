const {
	default: connectServer,
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeInMemoryStore,
	makeCacheableSignalKeyStore,
	jidDecode,
	proto,
	delay,
	getContentType,
	Browsers,
	fetchLatestWaWebVersion,
	PHONENUMBER_MCC,
	downloadMediaMessage
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const {
	Boom
} = require("@hapi/boom");
const fs = require("fs");
const { writeFile } = require("fs/promises");
const axios = require("axios");
const chalk = require("chalk");
const figlet = require("figlet");
const _ = require("lodash");
const PhoneNumber = require("awesome-phonenumber");
const NodeCache = require("node-cache");
const readline = require("readline");
const mineflayer = require('mineflayer');
const { Telegraf } = require('telegraf')
const mineflayerViewer = require('prismarine-viewer').mineflayer

const token = ""
const useStore = true;
const grouptoken = ""//https://api.telegram.org/bot<token>/getUpdates
const telegram = new Telegraf(token)
const bot = mineflayer.createBot({
        host: "alvlp.aternos.me",
        port: "52346",
        username: "nekonux_bot",
        //version: false
    })
    
console.log('Starting bot...')

    //Tele
    telegram.on('text', async (ctx) => {
        // Check if message was received from chosen group
        if (ctx.update.message.chat.id.toString() === grouptoken) {
            console.log(`[TELE] ${ctx.update.message.from.first_name}: ${ctx.update.message.text}`)
            // Send message to MC server
            bot.chat(`${ctx.update.message.from.first_name}: ${ctx.update.message.text}`)
        }
    })
    
function createBot() {
    console.log('Initializing..')
    
    // Redirect in-game messages to telegram group
    bot.on('chat', (username, message) => {
        if (username === bot.username) return
        console.log(`[SERVER] ${username} ${message}`)
        telegram.telegram.sendMessage(grouptoken, username + ': ' + message)
    })
    
    bot.on('chat', (username, message) => {
        if (username === bot.username) return
        console.log(`[SERVER] ${username} ${message}`)
        switch (message) {
            case ';start':
                console.log('[CMD] Bot Start command received')
                bot.chat('&l&c[SERVER] &a&lBot Started!')
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
        console.log('[BOT] Bot spawned')
        //mineflayerViewer(bot, { port: 3007, firstPerson: false })
        bot.chat('&a&lBot Connected')
    })

    bot.on('death', function() {
        console.log('Bot died, respawning')
        bot.chat('&l&c I died, respawn')
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
    
}

    
    function smsg(conn, m, store) {
	if (!m) return m;
	let M = proto.WebMessageInfo;
	if (m.key) {
		m.id = m.key.id;
		m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
		m.chat = m.key.remoteJid;
		m.fromMe = m.key.fromMe;
		m.isGroup = m.chat.endsWith("@g.us");
		m.sender = conn.decodeJid((m.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
		if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
	}
	if (m.message) {
		m.mtype = getContentType(m.message);
		m.msg = m.mtype == "viewOnceMessage" ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype];
		m.body =
			m.message.conversation ||
			m.msg.caption ||
			m.msg.text ||
			(m.mtype == "viewOnceMessage" && m.msg.caption) ||
			m.text;
		let quoted = (m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null);
		m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
		if (m.quoted) {
			let type = getContentType(quoted);
			m.quoted = m.quoted[type];
			if (["productMessage"].includes(type)) {
				type = getContentType(m.quoted);
				m.quoted = m.quoted[type];
			}
			if (typeof m.quoted === "string")
				m.quoted = {
					text: m.quoted,
				};
			m.quoted.mtype = type;
			m.quoted.id = m.msg.contextInfo.stanzaId;
			m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat;
			m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith("BAE5") && m.quoted.id.length === 16 : false;
			m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
			m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);
			m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || "";
			m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [];
			m.getQuotedObj = m.getQuotedMessage = async () => {
				if (!m.quoted.id) return false;
				let q = await store.loadMessage(m.chat, m.quoted.id, conn);
				return exports.smsg(conn, q, store);
			};
			let vM = (m.quoted.fakeObj = M.fromObject({
				key: {
					remoteJid: m.quoted.chat,
					fromMe: m.quoted.fromMe,
					id: m.quoted.id,
				},
				message: quoted,
				...(m.isGroup ? {
					participant: m.quoted.sender
				} : {}),
			}));

			/**
			 *
			 * @returns
			 */
			m.quoted.delete = () => conn.sendMessage(m.quoted.chat, {
				delete: vM.key
			});

			/**
			 *
			 * @param {*} jid
			 * @param {*} forceForward
			 * @param {*} options
			 * @returns
			 */
			m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);

			/**
			 *
			 * @returns
			 */
			m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
		}
	}
	if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg);
	m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || "";
	/**
	 * Reply to this message
	 * @param {String|Object} text
	 * @param {String|false} chatId
	 * @param {Object} options
	 */
	m.reply = (text, chatId = m.chat, options = {}) => (Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, "file", "", m, {
		...options
	}) : conn.sendText(chatId, text, m, {
		...options
	}));
	/**
	 * Copy this message
	 */
	m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));

	return m;
}


	
async function whatsapp () {
	const {
		version,
		isLatest
	} = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
	
	console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);
const MAIN_LOGGER = pino({
	timestamp: () => `,"time":"${new Date().toJSON()}"`,
});

const logger = MAIN_LOGGER.child({});
logger.level = "fatal";

const store = useStore ? makeInMemoryStore({ logger }) : undefined;
store?.readFromFile(`db/store.json`);

setInterval(() => {
	store?.writeToFile("db/store.json");
}, 60000 * 60);

const msgRetryCounterCache = new NodeCache();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const question = text => new Promise(resolve => rl.question(text, resolve));

const P = require("pino")({
	level: "fatal",
});
const {
		state,
		saveCreds
	} = await useMultiFileAuthState(`./session`);


    const ara = connectServer({
        logger: P,
        printQRInTerminal: false, // popping up QR in terminal log
      browser: ["Ubuntu", "Chrome", "20.0.04"], // for this issues https://github.com/Whiskeysockets/Baileys/issues/328
      patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      markOnlineOnConnect: true, // set false for offline
      generateHighQualityLinkPreview: true, // make high preview link
      getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg.message || undefined
            }
        },
      msgRetryCounterCache, // Resolve waiting messages
      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/Whiskeysockets/Baileys/issues/276
   })
   store?.bind(ara.ev);
   
   
   	// Handle error
	const unhandledRejections = new Map();
	process.on("unhandledRejection", (reason, promise) => {
		unhandledRejections.set(promise, reason);
		console.log("Unhandled Rejection at:", promise, "reason:", reason);
	});
	process.on("rejectionHandled", (promise) => {
		unhandledRejections.delete(promise);
	});
	process.on("Something went wrong", function(err) {
		console.log("Caught exception: ", err);
	});

	// Setting
	ara.decodeJid = (jid) => {
		if (!jid) return jid;
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {};
			return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
		} else return jid;
	};

	ara.ev.on("contacts.update", (update) => {
		for (let contact of update) {
			let id = ara.decodeJid(contact.id);
			if (store && store.contacts) store.contacts[id] = {
				id,
				name: contact.notify
			};
		}
	});

	ara.getName = (jid, withoutContact = false) => {
		id = ara.decodeJid(jid);
		withoutContact = ara.withoutContact || withoutContact;
		let v;
		if (id.endsWith("@g.us"))
			return new Promise(async (resolve) => {
				v = store.contacts[id] || {};
				if (!(v.name || v.subject)) v = ara.groupMetadata(id) || {};
				resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
			});
		else
			v =
			id === "0@s.whatsapp.net" ?
			{
				id,
				name: "WhatsApp",
			} :
			id === ara.decodeJid(ara.user.id) ?
			ara.user :
			store.contacts[id] || {};
		return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
	};

	ara.public = true;

	ara.serializeM = (m) => smsg(ara, m, store);
	
ara.ev.on("connection.update", async (update) => {
		const {
			connection,
			lastDisconnect
		} = update;
		if (connection === "close") {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
			if (reason === DisconnectReason.badSession) {
				console.log(`Bad Session File, Please Delete Session and Scan Again`);
				process.exit();
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log("Connection closed, reconnecting....");
				whatsapp();
			} else if (reason === DisconnectReason.connectionLost) {
				console.log("Connection Lost from Server, reconnecting...");
				whatsapp();
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log("Connection Replaced, Another New Session Opened, Please Rewhatsapp Bot");
				process.exit();
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
				process.exit();
			} else if (reason === DisconnectReason.rewhatsappRequired) {
				console.log("Rewhatsapp Required, Rewhatsapping...");
				whatsapp();
			} else if (reason === DisconnectReason.timedOut) {
				console.log("Connection TimedOut, Reconnecting...");
				whatsapp();
			} else {
				console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
				whatsapp();
			}
		} else if (connection === "open") {
console.log("Bot Connected")
		}
		// console.log('Connected...', update)
	});

	ara.ev.on("creds.update", saveCreds);
	
	
	ara.ev.on("messages.upsert", async (chatUpdate) => {
		try {
			let uwu = chatUpdate.messages[0];
			m = smsg(ara, uwu, store);
			if (!uwu.message) return;
			uwu.message = Object.keys(uwu.message)[0] === "ephemeralMessage" ? uwu.message.ephemeralMessage.message : uwu.message;

			if (uwu.key.remoteJid.endsWith('@s.whatsapp.net')) {
				if (uwu.message?.protocolMessage) return;
                console.log(chalk.green(`⫸ 『 ${m.pushName} | ${m.text}`));
                
			}
			

/*			if (m.key.remoteJid === "status@broadcast") {
				if (uwu.message?.protocolMessage) return;
				console.log(`Success ${uwu.pushName} ${uwu.key.participant.split('@')[0]}\n`);
				ara.readMessages([uwu.key]);
*/

				return;
			
		} catch (err) {
			console.log(err);
		}
	});
	
	
		if (!ara.authState.creds.registered) {
      let phoneNumber
      if (!!phoneNumber) {
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.whatsappsWith(v))) {
            console.log("Number: ")
            process.exit(0)
         }
      } else {
         phoneNumber = await question((`Please type your WhatsApp number:`))
         phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

         // Ask again when entering the wrong number
         if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.whatsappsWith(v))) {
            console.log("Start with country code of your WhatsApp Number: ")

            phoneNumber = await question(`Please type your WhatsApp number: `)
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
            rl.close()
         }
      }

      setTimeout(async () => {
         let code = await ara.requestPairingCode(phoneNumber)
         code = code?.match(/.{1,4}/g)?.join("-") || code
         console.log(`Your Pairing Code : `, code)
      }, 3000)
   }
   
   	const getBuffer = async (url, options) => {
		try {
			options ? options : {};
			const res = await axios({
				method: "get",
				url,
				headers: {
					DNT: 1,
					"Upgrade-Insecure-Request": 1,
				},
				...options,
				responseType: "arraybuffer",
			});
			return res.data;
		} catch (err) {
			return err;
		}
	};

	ara.sendImage = async (jid, path, caption = "", quoted = "", options) => {
		let buffer = Buffer.isBuffer(path) ?
			path :
			/^data:.*?\/.*?;base64,/i.test(path) ?
			Buffer.from(path.split`,` [1], "base64") :
			/^https?:\/\//.test(path) ?
			await await getBuffer(path) :
			fs.existsSync(path) ?
			fs.readFileSync(path) :
			Buffer.alloc(0);
		return await ara.sendMessage(jid, {
			image: buffer,
			caption: caption,
			...options
		}, {
			quoted
		});
	};

	ara.sendText = (jid, text, quoted = "", options) => ara.sendMessage(jid, {
		text: text,
		...options
	}, {
		quoted
	});

	ara.cMod = (jid, copy, text = "", sender = ara.user.id, options = {}) => {
		//let copy = message.toJSON()
		let mtype = Object.keys(copy.message)[0];
		let isEphemeral = mtype === "ephemeralMessage";
		if (isEphemeral) {
			mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
		}
		let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
		let content = msg[mtype];
		if (typeof content === "string") msg[mtype] = text || content;
		else if (content.caption) content.caption = text || content.caption;
		else if (content.text) content.text = text || content.text;
		if (typeof content !== "string")
			msg[mtype] = {
				...content,
				...options,
			};
		if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
		if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid;
		else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid;
		copy.key.remoteJid = jid;
		copy.key.fromMe = sender === ara.user.id;

		return proto.WebMessageInfo.fromObject(copy);
	};
}

createBot()
telegram.launch()
whatsapp()