const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js'); const { token, PATH } = require('./config.json');
const { codeBlock } = require("@discordjs/builders")
const { exec } = require("child_process");
const readFile = require('fs/promises')

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);


for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));


for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}


client.login(token);
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isModalSubmit()) return;

    const codeStr = interaction.fields.getTextInputValue('codeInput');
    const inputStr = interaction.fields.getTextInputValue('Input');

    if (interaction.customId === 'inputCode') {
        const msg = codeBlock("cpp", codeStr)
        await interaction.reply(`your code: ${ msg }`)
        const msg1 = codeBlock("cpp", inputStr)
        await interaction.followUp(`your input: ${ msg1 }`)
        
        fs.writeFile(PATH + '/commands/code/code.cpp', codeStr, (err) => {
            if (err) throw err;
        }
        )
        fs.writeFile(PATH + '/code/input.txt', inputStr, (err) => {
            if (err) throw err;
        }
        )        
        exec('bash' + PATH + '/commands/code/run.sh')
        
        await new Promise(r => setTimeout(r, 4000));
        fs.readFile(PATH + '/commands/code/out.txt', (err, out) => {
            if (err) throw err;
            interaction.followUp(codeBlock(out.toString()));
            
        })
}})