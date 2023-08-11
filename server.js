const express = require('express');
const server = express();
const config = require('./config.json');
const Discord = require('discord.js');
const { Client, MessageActionRow, MessageButton } = require('discord.js');
config.cfg.intents = new Discord.Intents(config.cfg.intents);
let fetch = require('node-fetch');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const client = new Discord.Client(config.cfg);

let nameUs = "";
let neuro = "";
let sd = false;
let peregen = 'false';
let stabla = false;


server.all('/', (req, res) => {

    res.send('бот запускается');
});



exports.keepAlive = function() {
    server.listen(3001, () => {
        console.log('сервер готов');
    });
}

let censorshipErrorSent = false;
let genericErrorSent = false;

let retryCount = new Map();

exports.TextImageRedirect = async function(param, param2, param3) {
    try {

        fs.writeFileSync('status.json', JSON.stringify({ isProcessing: true }), 'utf8');
        //console.log(Object.keys(param));

        if (param && typeof param === 'object' && param.content) {
            param.content = param.content.replace(/<(.|\n)*?>/g, '');
        }
        // param.content = param.content.replace(/<(.|\n)*?>/g, '');
        let nameUs = "";

        if (param.author.bot && !param.components || param.content == "Возникла ошибка, попробуйте ещё раз!") return false;
        // console.log(param);

        if (!param.author.bot) {
            // Используйте функцию для получения размера map
            const mapSize = readMapSizeFromFile();

            // if (peregen === 'false') {
            //     await param.channel.sendTyping();
            // }

            if (peregen === 'false') {
                param.reply("Картинка - " + param.content.replace(/\./g, '') + " - создаётся. Подождите примерно от 17 секунд, до 3 минут! Это сообщение пропадёт через 8 секунд").then(m => {
                    setTimeout(() => m.delete(), 8000);
                }).catch();
            }
            peregen = 'true';
        }

        var source = 'auto';
        fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' +
                source + "&tl=en&dt=t&q=" + encodeURI(param.content.replace(/<(.|\n)*?>/g, '').replace('..', '').trim() || param2))
            .then((response) => {
                return response.json();
            })
            .then(async(data) => {
                // let perevod = data[0][0][0];
                neuro = data[0][0][0];
                // console.log(neuro);
                (async function() {


                    // console.log(obj["process"]);
                    const massPromt = [
                        ' Art by James Gurney,extremly detailed,photography, digital painting',

                        'art by Ilya Kuvshinov, Painting By Ivan Shishkin, Painted By Alexei Savrasov, awesome atmosphere, 8 k, octane rendered, sharp focus, volumetric lighting',

                        'Painting By David Alabo, studio quality, the smallest drawing of details, 4k, octane, illustration,extremly detailed digital painting',

                        'elegant, glowing lights, highly detailed, digital painting, artstation, smooth, sharp focus, drawing of details, 4k, octanem, extremly detailed digital painting, art by national geographic',

                        'Painted By Alexei Savrasov, Painting By Claude Lorrain, highly detailed, digital painting, photography',

                        '',
                    ];
                    let massText = massPromt[5];
                    let suff;
                    neuro = '' + neuro;
                    //console.log(neuro);

                    if (neuro.includes('--v0')) {
                        massText = massPromt[5];
                        neuro = neuro.replace(/--v0\s?/g, '');
                        console.log('реалистичность');
                        sd = false;
                        suff = '';
                    } else if (neuro.includes('--v1')) {
                        massText = massPromt[0];
                        neuro = neuro.replace(/--v1\s?/g, '');
                        console.log('стиль 1');
                        sd = false;
                        suff = '--v1';
                    } else if (neuro.includes('--v2')) {
                        massText = massPromt[1];
                        neuro = neuro.replace(/--v2\s?/g, '');
                        console.log('стиль 2');
                        sd = false;
                        suff = '--v2';
                    } else if (neuro.includes('--v3')) {
                        massText = massPromt[2];
                        neuro = neuro.replace(/--v3\s?/g, '');
                        console.log('стиль 3');
                        sd = false;
                        suff = '--v3';
                    } else if (neuro.includes('--v4')) {
                        massText = massPromt[4];
                        neuro = neuro.replace(/--v4\s?/g, '');
                        console.log('стиль 4');
                        sd = false;
                        suff = '--v4';
                    } else if (neuro.includes('--sd')) {
                        sd = true;
                        massText = ' ';
                        // neuro = neuro.replace(/--sd\s?/g, '');
                        console.log('стиль sd');
                        suff = '--sd';
                    } else if (neuro.includes('--xd')) {
                        massText = ' ';
                        // neuro = neuro.replace(/--sd\s?/g, '');
                        console.log('стиль xd');
                        suff = '--xd';
                    } else if (neuro.includes('--bg')) {

                        massText = ' ';
                        // neuro = neuro.replace(/--sd\s?/g, '');
                        console.log('стиль bing');
                        suff = '--bg';
                    } else {
                        console.log('дефолтный стиль');
                        suff = ' ';
                    }



                    async function getImageUrls(page) {

                        if (neuro.includes('--sd')) {
                            try {
                                stabla = true;
                                await page.goto('https://stablediffusionai.org/#main');

                                await page.evaluate((neuroValue, massTextValue) => {
                                    const inputElement = document.querySelector('#prompt');
                                    inputElement.value = neuroValue.replace(/--sd\s?/g, '') + ' ' + massTextValue;
                                }, neuro, massText);

                                await page.evaluate((neuroValue, massTextValue) => {
                                    const inputElement = document.querySelector('#negative');
                                    inputElement.value = 'sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), {{bad anatomy}}, (bad-artist:0.8), (bad-hands-5:0.8) , (bad-image-v2-39000:0.8) , duplicate, disfigured, mutation, mutated, deformed, (poorly drawn face), cloned face, cross eyed, long neck, extra fingers, mutated hands,(fused fingers)';
                                }, neuro, massText);


                                const button = await page.$('#dimension1');
                                // console.log('Нашли кнопку #dimension2');
                                await button.click();

                                const button2 = await page.$('#sendData');
                                // console.log('Нашли кнопку #sendData');
                                await button2.click();
                                await page.waitForTimeout(2000);

                                // Ждем пока элемент появится
                                await page.waitForSelector('#main .message-timer');
                                // console.log('Элемент .message-timer появился');

                                // Проверяем каждую секунду, исчез ли элемент
                                await page.waitForFunction(
                                    'getComputedStyle(document.querySelector("#main .message-timer")).display == "none"', { polling: 1000 }
                                );

                                // console.log('Элемент .message-timer исчез');

                                const button2Again = await page.$('#sendData');
                                await button2Again.click();
                                // await page.waitForTimeout(30000);

                                // Ждем, пока все изображения загрузятся в формате base64
                                await page.waitForFunction(() => {
                                    // Получаем все изображения на странице
                                    const images = document.querySelectorAll('.container__input_item.animated.fadeIn > .container__input__item__img > img');
                                    // Проверяем, что каждое изображение загружено в формате base64
                                    return Array.from(images).every(img => img.src.startsWith('data:image/png;base64,'));
                                }, { polling: 1000 }); // Проверяем каждую секунду

                                // Теперь все изображения загружены в формате base64, можно их скачать
                                const urls = await page.$$eval('.container__input_item.animated.fadeIn > .container__input__item__img > img', imgs => imgs.map(img => img.src));


                                // console.log('URLs изображений:', urls);


                                // Преобразование каждого URL в изображение и сохранение его как файл
                                urls.forEach((url, index) => {
                                    let base64Image = url.replace('data:image/png;base64,', '');
                                    let data = Buffer.from(base64Image, 'base64');
                                    fs.writeFileSync(`images/image${index}.jpg`, data);
                                });

                                // console.log('Изображения успешно сохранены');
                                return urls;

                            } catch (error) {

                                let currentRetryCount = retryCount.get(param.content) || 0;

                                console.log('Проблемы с поиском картинок');

                                if (currentRetryCount < 2) {
                                    retryCount.set(param.content, currentRetryCount + 1);
                                    // param.reply('Попытка перегенерации изображения...').then(m => {
                                    //     setTimeout(() => m.delete(), 10000);
                                    // }).catch();
                                    await browser.close();

                                    exports.TextImageRedirect(param, param2, param3);
                                } else {
                                    param.reply(`<@${param3 || param.author.id}> ` + " Очень жаль, бот не может сгенерировать изображение по вашему запросу, попробуйте другой запрос! Или повторите этот запрос чуть позже!").then(m => {
                                        setTimeout(() => m.delete(), 10000);
                                    }).catch();
                                    peregen = 'false';
                                    retryCount.delete(param.content);
                                    await browser.close();
                                    fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                                    return;
                                }
                                return;

                            }



                        }
                        if (neuro.includes('--bg')) {

                            neuro = neuro.replace(/--bg\s?/g, '');
                            const isLoggedIn = await loginWithCookies(page);
                            if (!isLoggedIn) {

                                await loginWithCredentials(page);
                            }

                            await page.goto('https://www.bing.com/images/create');

                            // await page.waitForTimeout(2000);
                            await page.evaluate(() => {
                                const observer = new MutationObserver((mutationsList) => {
                                    for (let mutation of mutationsList) {
                                        if (mutation.type === 'childList') {

                                            let element1 = document.querySelector('#idSIButton9');
                                            let element2 = document.querySelector('#bnp_btn_accept');
                                            let emailField = document.querySelector('input[type="email"]');
                                            let passwordField = document.querySelector('input[type="password"]');
                                            let submitButton = document.querySelector('input[type="submit"]');

                                            if (element1) {
                                                element1.click();
                                            }
                                            if (element2) {
                                                element2.click();
                                            }
                                            if (emailField) {
                                                emailField.value = 'test-bing1979@outlook.com'; // Заполняем поле email
                                                if (submitButton) {
                                                    submitButton.click(); // Нажимаем кнопку "Отправить"
                                                }
                                            }
                                            if (passwordField) {
                                                passwordField.value = 'qazwsxedcr1'; // Заполняем поле password
                                                if (submitButton) {
                                                    submitButton.click(); // Нажимаем кнопку "Отправить"
                                                }
                                            }
                                        }
                                    }
                                });

                                observer.observe(document.body, { childList: true, subtree: true });
                            });

                            await page.evaluate((neuroValue, massTextValue) => {
                                const textarea = document.querySelector('#sb_form_q');
                                textarea.value = neuroValue + ', ' + massTextValue;
                            }, neuro, massText);

                            await page.click('#create_btn_c');

                            await page.waitForSelector('#idSIButton9');
                            await page.click('#idSIButton9');

                            try {
                                await Promise.race([
                                    page.waitForSelector('.img_cont.hoff', { timeout: 75 * 1000 }),
                                    page.waitForSelector('.gil_err_tc', { timeout: 35 * 1000 }).then(() => {
                                        throw new Error('Censorship Error');
                                    })
                                ]);

                            } catch (error) {
                                let currentRetryCount = retryCount.get(param.content) || 0;

                                if (error.message === 'Censorship Error') {
                                    console.log('Проблемы с цензурой');
                                    param.reply(`<@${param3 || param.author.id}> ` + " Цензура не пропустила запрос").then(m => {
                                        setTimeout(() => m.delete(), 10000);
                                    }).catch();
                                    peregen = 'false';
                                    fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                                    await browser.close();
                                    return;
                                }


                                console.log('Проблемы с поиском картинок');
                                if (currentRetryCount < 2) {
                                    retryCount.set(param.content, currentRetryCount + 1);
                                    // param.reply('Попытка перегенерации изображения...').then(m => {
                                    //     setTimeout(() => m.delete(), 10000);
                                    // }).catch();
                                    await browser.close();
                                    exports.TextImageRedirect(param, param2, param3);
                                } else {
                                    param.reply(`<@${param3 || param.author.id}> ` + " Очень жаль, bot не может сгенерировать изображение по вашему запросу, попробуйте другой запрос! Или повторите этот же запрос немного позже!").then(m => {
                                        setTimeout(() => m.delete(), 10000);
                                    }).catch();
                                    retryCount.delete(param.content);
                                    peregen = 'false';
                                    await browser.close();
                                    fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                                    return;
                                }
                                return;

                            }

                            return await page.evaluate(() => {
                                const imgElements = document.querySelectorAll('.img_cont.hoff img');
                                const urls = [];
                                imgElements.forEach((imgElement) => {
                                    urls.push(imgElement.src);
                                });
                                return urls;
                            });

                        }
                        try {
                            stabla = true;
                            await page.goto('https://clipdrop.co/stable-diffusion', { timeout: 210000 });

                            await page.waitForTimeout(8000);

                            await page.evaluate((neuroValue, massTextValue) => {
                                const inputElement = document.querySelector('#initml-layout_content > main > div > div.w-full.flex.flex-1.flex-col.items-center.justify-start.py-8 > section > div > form > div.flex.items-center.justify-center.gap-2.w-full.p-2 > div > textarea');
                                inputElement.value = neuroValue.replace(/--xd\s?/g, '') + ' ' + massTextValue;

                                const buttons = Array.from(document.querySelectorAll('button'));
                                const button = buttons.find(button => button.textContent.trim() === 'Generate');
                                if (button) {
                                    button.click();
                                    // console.log('кликнули по кнопке');
                                } else {
                                    console.log('Button not found');
                                }

                            }, neuro, massText);


                            console.log('кликнули по кнопке');
                            // const buttons = await page.$$('button');
                            // for (let button of buttons) {
                            //     let buttonText = await page.evaluate(button => button.textContent, button);
                            //     if (buttonText.trim() === 'Generate') {
                            //         await button.click();
                            //         console.log('кликнули по кнопке');
                            //         break;
                            //     }
                            // }

                            // Функция для наблюдения за изменениями в DOM
                            // function observeMutations() {
                            //     try {
                            //         const targetNode = document.body; // Можно выбрать другой элемент для наблюдения

                            //         const observer = new MutationObserver((mutations) => {
                            //             mutations.forEach(async(mutation) => {
                            //                 try {
                            //                     const buttons = await page.$$('button');
                            //                     for (let button of buttons) {
                            //                         let buttonText = await page.evaluate(button => button.textContent, button);
                            //                         if (buttonText.trim() === 'Continue in free mode') {
                            //                             await button.click();
                            //                             observer.disconnect(); // Остановить наблюдение после клика
                            //                             console.log('кликнули по кнопке Continue in free mode');
                            //                             break;
                            //                         }
                            //                     }
                            //                 } catch (error) {
                            //                     console.error('Ошибка при обработке мутаций:', error);
                            //                 }
                            //             });
                            //         });

                            //         // Начать наблюдение
                            //         observer.observe(targetNode, { childList: true, subtree: true });
                            //     } catch (error) {
                            //         console.error('Ошибка при инициализации наблюдения:', error);
                            //     }
                            // }

                            // // Запустить функцию наблюдения в контексте страницы
                            // try {
                            //     await page.evaluate(observeMutations);
                            // } catch (error) {
                            //     console.error('Ошибка при запуске функции наблюдения:', error);
                            // }


                            // const maxTimeout = 300000; // Максимальное время ожидания в миллисекундах
                            // const interval = 1000; // Интервал проверки в миллисекундах
                            // const startTime = Date.now(); // Время начала ожидания
                            // let images = []; // Массив для сохранения загруженных изображений

                            // await page.waitForFunction(() => {
                            //     const imageElements = Array.from(document.querySelectorAll('button.text-gray-500 > img'));
                            //     const imagesLoaded = imageElements.filter(img => img.src.startsWith('blob:'));
                            //     return imagesLoaded.length >= 4;
                            // }, { polling: interval, timeout: maxTimeout });

                            // const elapsedTime = Date.now() - startTime; // Прошедшее время в миллисекундах

                            // if (elapsedTime < maxTimeout) {
                            //     images = await page.$$eval('button.text-gray-500 > img', imgs => imgs.map(img => img.src));
                            // } else {
                            //     images = await page.$$eval('button.text-gray-500 > img', imgs => {
                            //         const loadedImages = imgs.filter(img => img.src.startsWith('blob:'));
                            //         return loadedImages.map(img => img.src);
                            //     });
                            // }

                            const waitForImages = (count, timeout, extendedTimeout) => {
                                return new Promise(resolve => {
                                    let imagesCount = 0;
                                    const intervalId = setInterval(async() => {
                                        imagesCount = await page.evaluate(() => {
                                            const images = document.querySelectorAll('.pointer-events-auto img');
                                            return images.length;
                                        });

                                        if (imagesCount >= count) {
                                            clearInterval(intervalId);
                                            resolve(imagesCount);
                                        }
                                    }, 1000);

                                    setTimeout(() => {
                                        if (imagesCount >= 2) {
                                            clearInterval(intervalId);
                                            resolve(imagesCount);
                                        } else if (imagesCount === 0) {
                                            setTimeout(() => {
                                                if (imagesCount >= 2) {
                                                    clearInterval(intervalId);
                                                    resolve(imagesCount);
                                                } else {
                                                    clearInterval(intervalId);
                                                    resolve(false);
                                                }
                                            }, extendedTimeout - timeout);
                                        } else {
                                            clearInterval(intervalId);
                                            resolve(imagesCount);
                                        }
                                    }, timeout);
                                });
                            };

                            await waitForImages(4, 70000, 210000);


                            await page.waitForSelector('.pointer-events-auto img', { timeout: 210000 }); // увеличиваем таймаут до 500 секунд
                            const urls = await page.$$eval('.pointer-events-auto img', imgs => imgs.map(img => img.src));
                            console.log('массив картинок найден');



                            // Преобразуем каждый blob URL в изображение и сохраняем его как файл
                            for (let i = 0; i < urls.length; i++) {
                                const url = urls[i];

                                try {
                                    const buffer = await page.evaluate(blobUrl => {
                                        return fetch(blobUrl)
                                            .then(response => response.arrayBuffer())
                                            .then(arrayBuffer => Array.from(new Uint8Array(arrayBuffer)));
                                    }, url);

                                    fs.writeFileSync(path.join('images', `image${i}.jpg`), new Uint8Array(buffer));
                                    //console.log(`Изображение ${i} успешно сохранено`);
                                } catch (err) {
                                    let currentRetryCount = retryCount.get(param.content) || 0;

                                    console.log('Проблемы с поиском картинок');

                                    if (currentRetryCount < 2) {
                                        retryCount.set(param.content, currentRetryCount + 1);
                                        // param.reply('Попытка перегенерации изображения...').then(m => {
                                        //     setTimeout(() => m.delete(), 10000);
                                        // }).catch();
                                        await browser.close();

                                        exports.TextImageRedirect(param, param2, param3);
                                    } else {
                                        param.reply(`<@${param3 || param.author.id}> ` + " Очень жаль, бот не может сгенерировать изображение по вашему запросу, попробуйте другой запрос! Или повторите этот запрос чуть позже!").then(m => {
                                            setTimeout(() => m.delete(), 10000);
                                        }).catch();
                                        peregen = 'false';
                                        retryCount.delete(param.content);
                                        await browser.close();
                                        fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                                        return;
                                    }
                                    return;
                                }
                            }


                            return urls;

                        } catch (error) {

                            let currentRetryCount = retryCount.get(param.content) || 0;

                            console.log('Проблемы с поиском картинок');

                            if (currentRetryCount < 2) {
                                retryCount.set(param.content, currentRetryCount + 1);
                                // param.reply('Попытка перегенерации изображения...').then(m => {
                                //     setTimeout(() => m.delete(), 10000);
                                // }).catch();
                                await browser.close();

                                exports.TextImageRedirect(param, param2, param3);
                            } else {
                                param.reply(`<@${param3 || param.author.id}> ` + " Очень жаль, бот не может сгенерировать изображение по вашему запросу, попробуйте другой запрос! Или повторите этот запрос чуть позже!").then(m => {
                                    setTimeout(() => m.delete(), 10000);
                                }).catch();
                                peregen = 'false';
                                retryCount.delete(param.content);
                                await browser.close();
                                fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                                return;
                            }
                            return;

                        }

                    }



                    const browser = await launchBrowser();
                    const page = await browser.newPage();


                    // const isLoggedIn = await loginWithCookies(page);
                    // if (!isLoggedIn) {

                    //     await loginWithCredentials(page);
                    // }


                    const oldimgSrc = await getImageUrls(page);
                    let imgSrc; // Объявляем переменную здесь

                    if (Array.isArray(oldimgSrc)) {
                        imgSrc = oldimgSrc.map(url => url.replace('w=270&h=270', 'w=1024&h=1024'));
                    } else {
                        console.error('oldimgSrc is not an array:', oldimgSrc);
                    }

                    (async() => {

                        try {

                            if (param.author.bot) {
                                nameUs = param.content.replace(/ .*/, '').replace(/\D/g, "").replace(/\b\w*--\w*\b/g, '');

                            }
                            // Загрузите и сохраните все изображения
                            for (let i = 0; i < imgSrc.length; i++) {
                                if (imgSrc[i] && imgSrc[i].startsWith('http')) {
                                    await downloadImage(imgSrc[i], `images/image${i}.jpg`);
                                }
                            }

                            // Загрузите все изображения с диска и отправьте их в виде вложений
                            const attachments = [];
                            for (let i = 0; i < imgSrc.length; i++) {
                                attachments.push(new Discord.MessageAttachment(`images/image${i}.jpg`));
                            }

                            const row1 = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                    .setCustomId("style-1")
                                    .setLabel('Стиль 1')
                                    .setStyle('SECONDARY'),
                                    new MessageButton()
                                    .setCustomId("style-2")
                                    .setLabel('Стиль 2')
                                    .setStyle('SECONDARY'),
                                    new MessageButton()
                                    .setCustomId("style-3")
                                    .setLabel('Стиль 3')
                                    .setStyle('SECONDARY'),
                                    new MessageButton()
                                    .setCustomId("style-4")
                                    .setLabel('Стиль 4')
                                    .setStyle('SECONDARY'),
                                    new MessageButton()
                                    .setCustomId("stable-dif")
                                    .setLabel('Обновить')
                                    .setEmoji('🔄')
                                    .setStyle('SECONDARY')
                                );

                            const row2 = new MessageActionRow()
                                .addComponents(

                                    new MessageButton()
                                    .setCustomId("sd")
                                    .setLabel('Stable Diffusion')
                                    .setStyle('SECONDARY'),
                                    new MessageButton()
                                    .setCustomId("bg")
                                    .setLabel('Bing')
                                    .setStyle('SECONDARY'),
                                );

                            let clearMess = param.content.replace(/(--v1|--v2|--v3|--v4|--sd|--xd|--bg)/g, '');

                            // Отправьте сообщение с вложениями и компонентами (кнопками)
                            const message = await param.channel.send({
                                content: `<@${param3 || param.author.id}> ` + clearMess.replace(/<(.|\n)*?>/g, '').trim() || param2.replace(/(\w+--\w+)/g, ''),
                                files: attachments,
                                components: [row1, row2]
                            });

                            // Добавьте две реакции к сообщению (👍 и 👎)
                            await message.react('👍');
                            await message.react('👎');
                            fs.writeFileSync('status.json', JSON.stringify({ isProcessing: false }), 'utf8');
                            peregen = 'false';
                            await browser.close();


                        } catch (err) {
                            console.log(err);
                            await browser.close();
                            peregen = 'false';
                            // exports.TextImageRedirect(param, param2, param3);
                            return;

                        }
                    })();

                    return false;


                })();
            });

        return false;
    } catch (error) {
        console.error("Ошибка:", error);
        // peregen = 'false';
    }

}

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:93.0) Gecko/20100101 Firefox/93.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:94.0) Gecko/20100101 Firefox/94.0'
];

async function launchBrowser() {
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const browser = await puppeteer.launch({
        headless: false,
        timeout: 210000, // Увеличен таймаут здесь
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-infobars',
            '--window-size=1280,800',
            `--user-agent=${userAgent}`,
        ],
    });
    return browser;
}

async function setHeaders(page) {
    await page.setExtraHTTPHeaders({
        'X-Forwarded-For': '1.1.1.1',
    });
}

async function loginWithCookies(page) {

    let cookies = [];
    if (fs.existsSync('cookies.json')) {
        const cookiesString = fs.readFileSync('cookies.json');
        cookies = JSON.parse(cookiesString);
    }

    if (cookies.length > 0) {
        await page.setCookie(...cookies);

        await page.setExtraHTTPHeaders({
            'X-Forwarded-For': '1.1.1.1',
        });

        await page.goto('https://www.bing.com/images/create', {
            waitUntil: 'networkidle0',
        });

        return await page.evaluate(() => {
            return !!document.querySelector('#id_l');
        });
    }

    return false;
}

async function loginWithCredentials(page) {
    try {
        await page.goto('https://login.live.com/', { timeout: 60000 }); // Увеличен таймаут здесь
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 100 * 1000 }); // Увеличен таймаут здесь

        if (page.mainFrame().executionContext()) {
            //await page.type('input[type="email"]', 'wysiwygwebbuilder.offershop@gmail.com');
            //await page.type('input[type="email"]', 'test-bing1979@outlook.com');
            await page.type('input[type="email"]', 'wysiwygwebbuilder.offershop@gmail.com');
            await page.click('input[type="submit"]');
            await page.waitForTimeout(2000);
        }

        if (page.mainFrame().executionContext()) {
            await page.type('input[type="password"]', 'qazwsxedcr1');
            await page.click('input[type="submit"]');
        }

        if (page.mainFrame().executionContext()) {
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 100 * 1000 }); // Увеличен таймаут здесь
        }
    } catch (err) {
        console.error('Error during login: ', err);
    }
}


// Добавьте эту функцию, чтобы скачать изображения
async function downloadImage(url, destination) {
    try {
        if (!url) {
            console.error(`Invalid URL: ${url}`);
            return;
        }

        if (url.startsWith('data:image/png;base64,')) { // Если URL изображения начинается с этой строки, значит, это base64
            console.log('получили дату изображения');
            let base64Image = url.replace('data:image/png;base64,', "");
            let data = Buffer.from(base64Image, 'base64');
            fs.writeFileSync(destination, data); // Запись изображения в файл
            console.log('Изображение успешно сохранено');
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
            const response = await fetch(url);
            const buffer = await response.buffer();
            fs.writeFileSync(destination, buffer);
        } else {
            console.error(`Invalid URL: ${url}`);
        }
    } catch (error) {
        console.error("Ошибка при скачивании изображения или записи файла:", error);
    }
}

// Функция для чтения размера map из файла
function readMapSizeFromFile() {
    try {
        const data = fs.readFileSync('mapSize.json', 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData.size;
    } catch (err) {
        console.error('Ошибка при чтении размера map из файла:', err);
        return 0;
    }
}
