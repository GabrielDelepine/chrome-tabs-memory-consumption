'use strict';

const iconMin = 'min.png';
const iconMax = 'max.png';
const iconDefault = 'default.png';
const iconError = 'error.png';
const values = [
    2,
    3,
    4,
    5,
    7,
    9,
    10,
    12,
    15,
    18,
    20,
    25,
    30,
    35,
    40,
    45,
    50,
    55,
    60,
    70,
    80,
    90,
    100,
    110,
    120,
    122,
    130,
    150,
    170,
    190,
    200,
    300,
    350,
    400,
    500,
    600,
    700,
    800,
    900,
];

let min = Math.min(...values);
let max = Math.max(...values);

function getHumanMemorySize(bytes) {

    if (1024 > bytes) {
        return String(bytes) + ' bytes';
    } else {

        let Kb = Math.round(bytes / 1024);

        if (1024 > Kb) {
            return String(Kb) + ' Kb';
        } else {

            let Mb = Math.round(Kb / 1024);

            if (1024 > Mb) {
                return String(Mb) + ' Mb';
            } else {

                let Gb = Math.round(Mb / 1024);
                return String(Gb) + ' Gb';
            }
        }
    }
}

function getActiveTab() {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {

                if (1 !== activeTabs.length) {
                    reject(2);
                } else {
                    resolve(activeTabs[0]);
                }
            });
        } catch(e) {
            reject(1);
        }
    });
}

function getMemory() {
    return new Promise((resolve, reject) => {

        getActiveTab().then((activeTab) => {

            try {
                chrome.tabs.executeScript(activeTab.id, { code: 'window.performance.memory.usedJSHeapSize' }, (results) => {
                    if (null === results || isNaN(results)) {
                        reject(4);
                    } else {
                        resolve(results);
                    }
                });
            } catch(e) {
                reject(3);
            }

        }, reject);
    });
}

let lastIcon;
function setIcon(icon) {
    if (icon !== lastIcon) {
        chrome.browserAction.setIcon({ path: icon });
        lastIcon = icon;
    }
}

function updateIcon() {
    getMemory().then((memory) => {

        let memoryMb = Math.round(memory / 1024 / 1024);

        if (memoryMb < min) {
            setIcon(iconMin);
        } else if (memoryMb > max) {
            setIcon(iconMax);
        } else {
            let closestValue = values.reduce((prev, curr) => Math.abs(curr - memoryMb) < Math.abs(prev - memoryMb) ? curr : prev);
            setIcon(String(closestValue) + '.png');
        }
    }, (numErr) => {
        switch(true) {
            case (0 < numErr && 5 >= numErr):
                setIcon('error' + String(numErr) + '.png')
            break;
            default:
                setIcon(iconError);
        }
    });

}

chrome.browserAction.onClicked.addListener(() => {
    updateIcon();
    getActiveTab().then((activeTab) => {
        getMemory().then(memory => chrome.tabs.executeScript(activeTab.id, { code: `console.info('Used JS heap size : ${getHumanMemorySize(memory)}');` }));
    });
});
chrome.tabs.onActivated.addListener(updateIcon);
chrome.tabs.onCreated.addListener(updateIcon);
chrome.tabs.onUpdated.addListener(updateIcon);

function loopToUpdateIcon(ms) {
    updateIcon();
    setTimeout(() => {
        loopToUpdateIcon(ms);
    }, ms);
}

loopToUpdateIcon(4000);