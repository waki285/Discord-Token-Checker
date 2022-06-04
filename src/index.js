const ws = require('ws');
const fs = require('fs');
const chalk = require('chalk');
const retry = require('async-retry');
const pLimit = require('p-limit');
const YAML = require('yaml');
const glob = require('glob');
const prompt = require('prompt-sync') ();

const title = () => {
    return `\n [${chalk.cyan("1")}] Load Token\n [${chalk.cyan("2")}] Run\n`
}

if (!fs.existsSync('./config.yml')) {
    fs.writeFileSync('./config.yml', YAML.stringify({
        threads: 1000,
        retries: 20,
    }));
};

if (!fs.existsSync('./Tokens')) {
    fs.mkdirSync('./Tokens');
};

if (!fs.existsSync('./Results')) {
    fs.mkdirSync('./Results');
};

const config = YAML.parse(fs.readFileSync('./config.yml', 'utf8'));
const limit = pLimit(config.threads);

const cpm_calc = async () => {
    let old_ = 0;
    let new_ = 0;
    (async () => {
        while (true) {
            old_ = counter.checked;
            await new Promise(resolve => setTimeout(resolve, 1000));
            new_ = counter.checked;
            counter.cpm = (new_ - old_) * 60;
            if (counter.flag) {
                break;
            }
        }
    })();
}

const check = async (token) => {
    let flag = false;
    await retry(async bail => {
        return new Promise(async (resolve, reject) => {
            let WebSocket = new ws('wss://gateway.discord.gg/?v=9&encoding=json');
            WebSocket.on('open', async () => {
                WebSocket.send(JSON.stringify({
                    op: 2,
                    d: {
                        token,
                        properties: {
                            os: 'Windows',
                            browser: 'Discord Client',
                            release_channel: 'ptb',
                            client_version: '1.0.1014',
                            os_version: '10.0.22000',
                            os_arch: 'x64',
                            system_locale: 'ja',
                            client_build_number: '130383',
                            client_event_source: null,
                        }
                    }
                }));
            });
            WebSocket.on('close', async () => {
                if (!flag) {
                    counter.invalid ++;
                    console.log(` [${chalk.red("INVALID")}] ${chalk.red(token)}`);
                    if (!("INVALID" in outputs)) {
                        outputs["INVALID"] = fs.createWriteStream(`${output_folder}/INVALID.txt`);
                    }
                    outputs.INVALID.write(`${token}\n`);
                    resolve();
                }
            });
            WebSocket.on('message', async (data) => {
                const response = JSON.parse(data);
                if (response.t === 'READY') {
                    flag = true
                    if ("required_action" in response.d) {
                        counter.require ++;
                        console.log(` [${chalk.yellow(response.d.required_action.split("_").at(-1))}] ${chalk.yellow(token)}`);
                        WebSocket.close();
                        if (!(response.d.required_action.split("_").at(-1) in outputs)) {
                            outputs[response.d.required_action.split("_").at(-1)] = fs.createWriteStream(`${output_folder}/${response.d.required_action.split("_").at(-1)}.txt`);
                        }
                        outputs[response.d.required_action.split("_").at(-1)].write(`${token}\n`);
                        resolve();
                    } else {
                        counter.success ++;
                        console.log(` [${chalk.green("!")}] ${chalk.green(token)}`);
                        WebSocket.close();
                        if (!("SUCCESS" in outputs)) {
                            outputs["SUCCESS"] = fs.createWriteStream(`${output_folder}/SUCCESS.txt`);
                        }
                        outputs.SUCCESS.write(`${token}\n`);
                        resolve();
                    }
                }
            });
            WebSocket.on('error', async (err) => {
                counter.error ++;
                reject();
            });
        }, {
            retries: config.retries,
        });
    });
}

let tokens
let counter
let outputs
let output_folder
(async () => {
    while (true) {
        console.clear();
        process.title = "Discord Token Checker - Coded by @L2";
        counter = {
            flag: false,
            checked: 0,
            success: 0,
            invalid: 0,
            require: 0,
            error: 0,
            cpm: 0
        };
        console.log(title());
        const select = prompt(` [${chalk.red("!")}] Choose a module: `);
        if (select === "1") {
            while (true) {
                console.clear();
                console.log();
                const files = glob.sync('./Tokens/*.txt');
                if (files.length > 0) {
                    for (i in files) {
                        console.log(` [${chalk.cyan(Number(i)+1)}]`, files[i].split('/').at(-1));
                    };
                    console.log();
                    const file = prompt(` [${chalk.red("!")}] Choose a file: `);
                    if (!isNaN(file) & 1 <= Number(file) & Number(file) <= files.length) {
                        tokens = fs.readFileSync(files[Number(file)-1], 'utf8').trim().split(/\r\n|\n/);
                        console.log(`\n\n [${chalk.green("!")}] Loaded: ${tokens.length} tokens`);
                        break;
                    } else {
                        continue;
                    }
                } else {
                    console.log(chalk.red(` [${chalk.red("!")}] No file found!`));
                    break;
                }
            }
            console.log();
            prompt(` [${chalk.red("!")}] Press any key to continue... `);
        } else if (select === "2") {
            if (tokens) {
                output_folder = `./Results/${new Date().toLocaleString().replace(/\//g, '-').replace(/:/g, '.')}`;
                fs.mkdirSync(output_folder);
                outputs = {};
                cpm_calc();
                process.title = `Discord Token Checker - Coded by @L2 | Checked: 0 (0.00%) - Left: ${tokens.length} - Invalid: 0 (NaN) - Success: 0 (NaN) - Require: 0 (NaN) - Error: (0) | CPM: 0`;
                await Promise.all(
                    tokens.map(
                        token => {
                            return limit(() => check(token)).then(
                                () => {
                                    counter.checked ++;
                                    process.title = `Discord Token Checker - Coded by @L2 | Checked: ${counter.checked.toLocaleString()} (${(counter.checked/tokens.length*100).toFixed(2)}%) - Left: ${(tokens.length-counter.checked).toLocaleString()} - Invalid: ${counter.invalid.toLocaleString()} (${(counter.invalid/counter.checked*100).toFixed(2)}%) - Success: ${counter.success.toLocaleString()} (${(counter.success/counter.checked*100).toFixed(2)}%) - Require: ${counter.require.toLocaleString()} (${(counter.require/counter.checked*100).toFixed(2)}%) - Error: (${counter.error}) | CPM: ${counter.cpm}`;
                                }
                            )
                        }
                    )
                ).then(
                    () => {
                        console.log(`\nResults: \n{success: ${chalk.green(counter.success)}, require: ${chalk.yellow(counter.require)}, invalid: ${chalk.red(counter.invalid)}}`);
                        Object.keys(outputs).forEach( async (key) => {
                            await outputs[key].end();
                        });
                        counter.flag = true;
                    }
                )
                console.log();
                prompt(` [${chalk.red("!")}] Press any key to continue... `);
            } else {
                continue;
            }
        } else {
            process.exit(0);
        }
    }
})();
