const Discord = require('discord.js');
const client = new Discord.Client();

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('db.json');
const db = low(adapter);

const shortid = require('shortid');

require('dotenv').config();


const PREFIX = '-';
const WHITELIST = ['Admin', 'Mod', 'Bots'];

client.on('ready', () => {
    console.log(`The Anti-Spam Discord Bot has started! \n Logged in as ${client.user.tag}`);

    db.defaults({
        links: [],
        reports: [],
        total: 0
    }).write();


});

client.on('message', async msg => {
    // Ignore if the user is a bot
    if (msg.author.bot) return;


    // Ignore if the user has permission
    if (msg.member.roles.find(r => WHITELIST.includes(r.name))) return;



    const regex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/i;
    let m;

    if ((m = regex.exec(msg.content)) !== null) {
        // NOTE: This only catches the first link
        // FUTURE: Create a link whitelist
        let link = m[0];

        msg.delete();

        db.update('total', n => n + 1).write();
        if (!db.get('links').map().value().includes(link)) {
            db.get('links')
                .push(link)
                .write();
        }




        let report = {
            _id: shortid.generate(),
            user: msg.author.tag,
            time: new Date().getTime(),
            channel: msg.channel.name,
            channelId: msg.channel.id,
            message: msg.content,
            messageId: msg.id,
            link,
        }

        db.get('reports').push(report).write();


        if (db.get('reports').filter({
                user: msg.author.tag
            }).size().value() >= 3) {
            msg.reply(` did you know that we know have a link reporting bot? \nThe message containg a link gets automatically deleted. ` +
                `You are at ${db.get('reports').filter({user: msg.author.tag}).size().value()} link deletes. If you exceed 5 total link deletes you will be kicked.`)
            if (db.get('reports').filter({
                    user: msg.author.tag
                }).size().value() >= 5) {
                msg.guild.fetchMember(msg.author)
                    .then(kicked => {
                        if (!kicked.kickable) console.error('I cannot kick ' + msg.author.tag + ', they currently have over 5 link posts');
                        kicked.kick(`You currently have ${db.get('reports').filter({
                            user: msg.author.tag
                        }).size().value()} link posts. Please do not posts that many links. If you have any questions please contact <@206857563206189058>`).catch(err => msg.reply(`You should be kicked but ${err}`));

                    });
            }
        }

    }

});

client.login(process.env.TOKEN);