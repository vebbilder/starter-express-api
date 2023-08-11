const Discord = require('discord.js');
const { Client, MessageActionRow, MessageButton } = require('discord.js');
const config = require('./config.json');
const { keepAlive, TextImageRedirect } = require('./server');
const fs = require('fs');
const { setTimeout } = require('timers/promises');
config.cfg.intents = new Discord.Intents(config.cfg.intents);
const client = new Discord.Client(config.cfg);

// Создаем map для хранения сообщений и интеракций
const messagesMap = new Map();
module.exports = messagesMap;

client.on('ready', () => {
    fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
    console.log(`Бот готов к работе`);

    // Запускаем циклическую проверку и обработку сообщений в map
    setInterval(() => {
        const status = JSON.parse(fs.readFileSync('status.json', 'utf8'));

        if (!status.isProcessing && messagesMap.size > 0) {
            const key = Array.from(messagesMap.keys())[0]; // Получаем ключ первого элемента в map
            const value = messagesMap.get(key); // Получаем значение первого элемента в map

            TextImageRedirect(value.message, value.content, value.userId)
                .then(() => {
                    messagesMap.delete(key); // Удаляем элемент из map после успешной обработки
                })
                .catch(err => {
                    console.error('Ошибка при обработке сообщения:', err);
                });
        }
    }, 2000);

    setInterval(async() => {
        if (messageToDelete && Date.now() - messageToDelete.timestamp >= 7000) { // Если прошло 7 секунд
            try {
                let m = await client.channels.cache.get(messageToDelete.channelId).messages.fetch(messageToDelete.id); // Получаем сообщение по ID
                m.delete(); // Удаляем сообщение
                messageToDelete = null; // Обнуляем переменную
            } catch (err) {
                console.error('Ошибка при удалении сообщения:', err);
            }
        }
    }, 1000);

});

client.login(config.token);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let messageToDelete = null;

client.on('messageCreate', async message => {
    try {
        if (message.author.bot) return; // Если автор сообщения - бот, прекращаем обработку

        if (!message.content.replace(/<(.|\n)*?>/g, '').trim()) {
            return;
        } else if (message.content.includes('@here') || message.content.includes('@everyone')) {
            return;
        } else if (message.content.startsWith('..') || message.mentions.has(client.user.id)) {
            const allowedGuilds = ['878760224499044433', '262883583428001792', '987163603926925332'];

            if (!allowedGuilds.includes(message.guild.id)) return;
            // console.log('Начинаем отсчет времени');

            // if (!message.content.includes('--sd') || !message.content.includes('--bg')) {
            //     TextImageRedirect(message, message.content, message.userId);
            //     return;
            // }

            // Если в map есть сообщения, отправляем ответ об ожидании и удаляем его через 10 секунд


            // Добавляем сообщение в map
            messagesMap.set(message.id, { message: message, content: message.content, userId: message.author.id });


            fs.writeFileSync('mapSize.json', JSON.stringify({ size: messagesMap.size }), 'utf8');

            await message.reply(`Ваш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`).then(m => {
                messageToDelete = { id: m.id, channelId: m.channel.id, timestamp: Date.now() }; // Записываем ID сообщения, ID канала и время создания
            }).catch(err => {
                console.error('Ошибка при отправке сообщения:', err);
            });
            message.channel.sendTyping();

        }
    } catch (err) {
        console.error('Ошибка в функции handleMessage:', err);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Создайте новый row с кнопками
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
            .setCustomId("style-1")
            .setLabel('Стиль 1')
            .setStyle(interaction.customId === "style-1" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "style-1"),
            new MessageButton()
            .setCustomId("style-2")
            .setLabel('Стиль 2')
            .setStyle(interaction.customId === "style-2" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "style-2"),
            new MessageButton()
            .setCustomId("style-3")
            .setLabel('Стиль 3')
            .setStyle(interaction.customId === "style-3" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "style-3"),
            new MessageButton()
            .setCustomId("style-4")
            .setLabel('Стиль 4')
            .setStyle(interaction.customId === "style-4" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "style-4"),
            new MessageButton()
            .setCustomId("stable-dif")
            .setLabel('Обновить')
            .setEmoji('🔄')
            .setStyle('SECONDARY'),
        );
    // Создайте новый row с кнопками
    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
            .setCustomId("sd")
            .setLabel('Stable Diffusion')
            .setStyle(interaction.customId === "sd" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "sd"),
            new MessageButton()
            .setCustomId("xd")
            .setLabel('Bing')
            .setStyle(interaction.customId === "bg" ? 'SUCCESS' : 'SECONDARY')
            .setDisabled(interaction.customId !== "bg"),

        );

    try {
        if (interaction.isButton()) {
            // interaction.message.channel.sendTyping();
            // Обновляем кнопки после всех условий
            // await interaction.deferUpdate();

            const inId = interaction.user.id;

            if (interaction.message instanceof Discord.Message) {


                if (interaction.message instanceof Discord.Message) {
                    try {
                        // Добавляем интеракцию в map
                        messagesMap.set(interaction.id, { message: interaction.message, content: interaction.message.content, userId: inId });

                    } catch (err) {
                        //console.error('Ошибка в обработчике кнопки:', err);
                    }

                    if (interaction.customId === 'style-1') {
                        const newContent = updateContent(interaction.message.content, '--v1');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле 1. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'style-2') {
                        const newContent = updateContent(interaction.message.content, '--v2');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле 2. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'style-3') {
                        const newContent = updateContent(interaction.message.content, '--v3');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле 3. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'style-4') {
                        const newContent = updateContent(interaction.message.content, '--v4');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле 4. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'sd') {
                        const newContent = updateContent(interaction.message.content, '--sd');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле stable diffusion. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'bg') {
                        const newContent = updateContent(interaction.message.content, '--bg');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется в стиле Bing. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    } else if (interaction.customId === 'stable-dif') {
                        const newContent = updateContent(interaction.message.content, '');
                        await interaction.update({
                            components: [row, row2],
                            content: newContent
                        });
                        await interaction.followUp({ content: `Картинка "${interaction.message.content}" обновляется. Подождите примерно от 17 секунд, до 3 минут!\nВаш запрос поставлен в очередь. Номер в очереди: ${messagesMap.size}`, ephemeral: true });
                    }

                }

            }



        }

    } catch (err) {
        console.error('Ошибка в функции handleInteraction:', err);
    }
});


function updateContent(content, suffix) {
    const matches = content.match(/(--v1|--v2|--v3|--v4)/g);
    if (matches && matches.length > 1) {
        // Удаляем все совпадения
        content = content.replace(/(--v1|--v2|--v3|--v4)/g, '');
        // Добавляем последний суффикс
        content += ' ' + suffix;
    } else if (!matches) {
        // Если совпадений не было, просто добавляем суффикс
        content += ' ' + suffix;
    }
    return content;
}


keepAlive();
