
/* ================================================================
   TAROT DU CLUB — MVP unifié 3 / 4 / 5 joueurs
   Moteur FFT : distribution par 3, enchères, chien/écart, appel au
   Roi (à 5), plis (fournir / couper / surcouper), Excuse, poignées,
   petit au bout, marque officielle par configuration.
   ================================================================ */
'use strict';
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const AUTO = /auto/.test(location.hash);          // mode test : le siège 0 est joué par un bot
const AUTO_DUP = /autodup/.test(location.hash);
let SPEED = AUTO ? 0.004 : 1; // multiplicateur de tempo
const T = ms => sleep(ms * SPEED);

const CFG = {
  3:{cards:24, chien:6, poignees:[13,15,18], targetBots:2},
  4:{cards:18, chien:6, poignees:[10,13,15], targetBots:3},
  5:{cards:15, chien:3, poignees:[8,10,13],  targetBots:4},
};
const CONTRACTS = [
  {id:'petite', label:'Petite',        coef:1, cls:'petite'},
  {id:'garde',  label:'Garde',         coef:2, cls:'garde'},
  {id:'gs',     label:'Garde sans',    coef:4, cls:'gs'},
  {id:'gc',     label:'Garde contre',  coef:6, cls:'gc'},
];
const TARGET = {0:56, 1:51, 2:41, 3:36};
const SUIT_ORDER = ['♠','♦','A','♥','♣']; // tri club : noir / rouge / atouts / rouge / noir
const SUIT_NAME = {'♠':'Pique','♥':'Cœur','♦':'Carreau','♣':'Trèfle'};
const RANK_LABEL = {11:'Valet',12:'Cavalier',13:'Dame',14:'Roi'};

/* ---------- Bots ---------- */
const BOT_POOL = [
  {name:'Léo',   emoji:'🧒', color:'#8fa3c0', level:1}, // débutant
  {name:'Nadia', emoji:'👩', color:'#c98a5e', level:2}, // intermédiaire
  {name:'Sacha', emoji:'🦊', color:'#7ba05b', level:2},
  {name:'Karim', emoji:'🧔', color:'#a06bb4', level:3}, // expérimenté
];
// Une douzaine de donnes témoins par table, jouées par le « Robot témoin » (Garde / Garde sans) : le duplicate est testable dès la 1ʳᵉ visite
const SEED_VIVIER = {"3":[{"id":"T3-01","n":3,"dealer":1,"hands":[["♠7","♠8","♠9","♠11","♦3","♦6","♦9","♦10","♦12","A1","A5","A6","A11","A14","A15","A17","♥6","♥7","♥11","♥12","♣6","♣8","♣12","♣14"],["♠3","♥5","♥9","A12","♦2","♠1","♦4","♠6","♣11","♠5","A2","♣1","A21","♥3","A18","♠2","♦1","♥2","EX","A9","♥1","A4","♦7","A3"],["♥13","♣7","♥4","♦13","♣10","A16","♥14","A8","♠13","♦14","♥10","♦5","A20","♣2","♣3","♣4","♠4","♠12","♦11","A7","A10","♣13","♥8","♠10"]],"chien":["A13","♦8","♠14","♣5","♣9","A19"],"date":1793359718138,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-128,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359719614}]},{"id":"T3-02","n":3,"dealer":1,"hands":[["♠1","♠3","♠10","♠11","♦7","♦11","A5","A6","A7","A8","A10","A19","♥1","♥2","♥3","♥4","♥9","♥12","♣2","♣3","♣7","♣9","♣10","♣11"],["♥14","A3","♣14","♥7","♦14","♠5","A20","♣5","♠13","♦10","A9","♣8","A17","A16","♠14","♠4","♠12","A12","♣13","A15","♥10","♣1","A2","♦12"],["♣6","♦5","♣4","♦13","♠9","♦4","♥11","♦8","♠2","A21","♠7","♥13","A14","♦9","♦2","A11","EX","♣12","♥5","♦6","♠6","A18","A13","♦1"]],"chien":["♥6","♥8","♠8","♦3","A4","A1"],"date":1793359722770,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":78,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359723996}]},{"id":"T3-03","n":3,"dealer":1,"hands":[["♠2","♠7","♠8","♠9","♠12","♠13","♦3","♦4","♦5","♦11","♦14","A6","A9","A10","A13","A15","A19","A21","♥9","♥10","♥14","♣4","♣6","♣13"],["♣5","A16","♣8","♣2","♠5","♥5","♦13","A17","♠6","A7","♥3","♦7","A18","♥8","♥11","♦2","♥2","♠4","♠11","A3","♣11","♠10","♣14","A4"],["♥4","♥7","A12","EX","A8","♥12","♣7","♦10","♦6","A1","♥13","♥1","♦8","♠1","♣12","♥6","♠14","A20","♦9","♣9","♦1","♠3","♦12","♣1"]],"chien":["A5","♣10","A14","A11","♣3","A2"],"date":1793359727098,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":106,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359728612}]},{"id":"T3-04","n":3,"dealer":1,"hands":[["♠1","♠5","♠6","♠13","♠14","♦2","♦7","♦12","A3","A8","A13","A14","A19","A21","♥1","♥2","♥5","♥8","♥11","♥13","♥14","♣3","♣7","♣8"],["A17","♣14","♥10","A10","A1","♦13","♠9","♣5","♦3","♥9","♠10","♦5","A12","A7","♣12","♣11","♠7","♣1","♠12","A18","♣10","♦9","♦1","♣4"],["♦10","♥4","♦6","A16","♣9","A4","♥3","EX","A9","♦14","♣2","♦11","♠2","A15","♠11","♣13","♦4","A20","♦8","♠3","A6","A11","♥6","♥7"]],"chien":["♣6","♥12","A5","A2","♠8","♠4"],"date":1793359731828,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":63,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359733129}]},{"id":"T3-05","n":3,"dealer":2,"hands":[["♠4","♠9","♦1","♦4","♦6","♦7","♦8","♦10","♦13","♦14","A4","A8","A10","A11","A17","A20","♥1","♥2","♥5","♥8","♥13","♥14","♣6","♣12"],["♥12","A5","♣1","A6","♣13","A15","♠1","A12","A18","♣5","♠2","♣14","A3","A21","A2","♣4","♠3","♠13","♥4","♣7","♣11","♦12","♥3","♥9"],["A13","♦3","♣2","♥11","♠11","♦11","♦2","♠6","♥7","A7","♠10","♣10","♠5","A9","♥6","♣8","EX","♠7","A1","A19","♠12","A14","♠14","♣3"]],"chien":["A16","♠8","♦9","♣9","♦5","♥10"],"date":1793359733326,"origin":{"contract":"garde","taker":"Nadia","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":88,"role":"Défense","contract":"garde","takerName":"Nadia","date":1793359734754}]},{"id":"T3-06","n":3,"dealer":2,"hands":[["♠2","♠3","♠9","♠12","♠13","♠14","♦4","♦5","♦6","♦7","A6","A10","A12","A19","A20","EX","♥3","♥4","♥12","♣1","♣6","♣7","♣11","♣12"],["♥1","♠1","♥8","A3","♣3","A13","♦2","A7","A4","A1","♦12","♠10","♦1","♦13","♠6","A8","♣9","A5","A11","♣4","♥11","♦11","A17","♥10"],["♦14","♠7","♦8","♠5","♣13","♥6","♥14","♥13","♦10","♣10","♣2","♣14","A16","A21","♥5","A15","♦9","♠11","♥2","A14","♥9","A18","A2","♣8"]],"chien":["♦3","A9","♠8","♠4","♣5","♥7"],"date":1793359742550,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-176,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359743820}]},{"id":"T3-07","n":3,"dealer":2,"hands":[["♠3","♠6","♠9","♦1","♦2","♦9","♦10","♦12","♦13","♦14","A5","A6","A7","A9","A16","A20","A21","♥5","♥8","♥11","♣4","♣5","♣7","♣10"],["♥6","A4","♥1","♥7","A15","♣12","♥3","♠12","A3","♥10","♠2","♠5","♣8","♠10","♦6","♦11","♠14","♠13","♠11","A14","♣14","EX","A19","♣2"],["♦5","♠4","♦8","♠1","♦3","♥4","♥14","♣13","♥2","♥13","A2","♣11","♦7","A17","♥12","A12","♠8","♣1","♣3","A10","A18","♠7","A11","♣9"]],"chien":["A8","A13","♣6","A1","♦4","♥9"],"date":1793359755851,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-208,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359757159}]},{"id":"T3-08","n":3,"dealer":1,"hands":[["♠1","♠2","♠6","♠7","♠8","♠10","♠12","♦6","♦8","♦9","♦14","A12","A13","A15","A18","A20","♥2","♥7","♥8","♥12","♥13","♥14","♣2","♣8"],["♦7","♥11","♥5","♠14","A14","♠9","A4","♥1","♦4","♣12","A2","♣11","A3","♦13","A9","♥6","♣3","♣13","A11","♦5","A8","A1","A5","♦10"],["♠5","♣7","♦3","♣6","♣4","♥10","♠13","♦2","A17","♦1","♠3","A21","♣14","♠4","♦11","♣10","♦12","♠11","A16","♥9","♥4","EX","♣1","♣9"]],"chien":["A19","♣5","♥3","A6","A10","A7"],"date":1793359763001,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-80,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359764332}]},{"id":"T3-09","n":3,"dealer":0,"hands":[["♠7","♠10","♠12","♠14","♦1","♦2","♦6","♦7","♦9","♦11","♦12","A1","A4","A5","A13","A19","A20","♥1","♥3","♥11","♥13","♣1","♣5","♣12"],["♣9","♠8","♥12","♦8","A6","♥10","♣8","♠2","A14","♥5","♠6","A11","A3","♠13","A10","A18","♥2","A2","A12","A7","♠4","♥8","♠3","♠1"],["♥4","♥6","♠11","♦3","♣13","♦14","♣10","♥14","♣3","A21","A17","♣6","♦4","♣4","♣7","♥9","EX","♦10","A9","♦13","♠5","♠9","A15","♥7"]],"chien":["♣14","♦5","♣2","A16","♣11","A8"],"date":1793359716648,"origin":{"contract":"gs","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-224,"role":"Preneur","contract":"gs","takerName":"Robot témoin","date":1793359717983}]},{"id":"T3-10","n":3,"dealer":2,"hands":[["♠2","♠8","♠12","♦2","♦10","♦11","A1","A3","A12","A13","A15","A18","♥1","♥3","♥6","♥11","♥13","♣3","♣6","♣7","♣8","♣9","♣11","♣14"],["♥10","A2","A19","♦13","♥5","♦12","♠11","♠7","A14","A21","A17","♣1","A10","♣2","A7","♠10","♦9","♣12","♠5","♠14","♠1","A5","♦14","A11"],["A9","♥12","A8","♣13","♠13","♥4","♦8","♣10","♥7","♥14","♠6","♦5","♦4","♥9","A16","A6","♦7","♦6","♠3","A4","♥8","EX","♦3","♥2"]],"chien":["♠4","♣5","A20","♦1","♣4","♠9"],"date":1793359719806,"origin":{"contract":"gs","taker":"Nadia","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":130,"role":"Défense","contract":"gs","takerName":"Nadia","date":1793359721085}]},{"id":"T3-11","n":3,"dealer":0,"hands":[["♠6","♠11","♠12","♦9","♦13","A3","A5","A9","A10","A15","A17","A18","EX","♥3","♥8","♥10","♥12","♥13","♥14","♣3","♣4","♣12","♣13","♣14"],["♦5","A19","♦4","A14","♥5","♠13","♣9","A12","A7","♥1","♠3","♥11","A16","♦11","♦6","♠7","♠2","♣8","♥7","A1","♥2","♠5","♦3","A21"],["♦7","A8","♣6","♣11","♦1","A4","♠9","♣7","♣2","A2","♥9","♦8","♦12","♦2","A6","♣10","A11","♦10","A13","♦14","♠4","♠10","♥6","♣5"]],"chien":["♠1","♣1","♠8","♥4","♠14","A20"],"date":1793359721268,"origin":{"contract":"gs","taker":"Nadia","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":148,"role":"Défense","contract":"gs","takerName":"Nadia","date":1793359722603}]}],"4":[{"id":"T4-01","n":4,"dealer":0,"hands":[["♠6","♠7","♦7","♦10","♦13","♦14","A1","A2","A5","A17","♥3","♥6","♥7","♥9","♥14","♣4","♣7","♣8"],["♥4","♥5","♦1","A21","♠1","♣6","♠5","♠11","A16","♣10","A4","♠2","♣1","A3","♣2","♠9","♠3","♦11"],["♥13","♦5","♣13","♠13","A14","♥12","A19","♣12","♦12","A11","♠12","EX","♦4","♠8","A13","A9","♥2","♣14"],["♥8","♣11","♦8","A7","A10","A12","♦2","♦3","♠14","♥1","♠4","♠10","A15","♣5","♣9","♥11","♦6","♣3"]],"chien":["♦9","♥10","A20","A6","A8","A18"],"date":1793359782595,"origin":{"contract":"garde","taker":"Sacha","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-50,"role":"Défense","contract":"garde","takerName":"Sacha","date":1793359783872}]},{"id":"T4-02","n":4,"dealer":1,"hands":[["♠4","♠12","♦1","♦4","♦13","A4","A7","A14","A18","A19","EX","♥4","♥6","♥12","♥13","♣9","♣12","♣14"],["♣8","♦12","A16","♦7","♥11","♠13","♠1","♠8","♠10","♣13","♠5","♦2","♥5","A13","A8","♣6","A11","♦8"],["♥14","A9","♥7","A17","A10","♦14","♣7","A3","A6","♥1","♦5","♦9","♠6","A5","♠9","♣2","♠14","♦11"],["♠7","♣1","♠3","♠11","A2","♣10","♥10","♦10","♥2","♠2","♥3","♣11","♣4","A21","♦3","A12","♥8","♥9"]],"chien":["♣5","♦6","♣3","A15","A20","A1"],"date":1793359784033,"origin":{"contract":"garde","taker":"Sacha","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":107,"role":"Défense","contract":"garde","takerName":"Sacha","date":1793359785361}]},{"id":"T4-03","n":4,"dealer":2,"hands":[["♠6","♠9","♦1","♦3","♦13","♦14","A10","A15","A18","A19","A21","♥9","♥10","♥11","♣2","♣6","♣8","♣9"],["A14","♠14","♣14","♦9","♥14","♠2","A13","♣5","♠4","A8","♣11","♦2","♥7","A6","♦6","♠10","♠8","♥8"],["♦8","♠12","♠13","♦5","♠5","♦4","A11","♥4","A2","♣4","♥5","♦10","♥13","♣13","A20","A4","♦11","♣7"],["A7","♣12","A12","♥3","♥6","♠1","A9","A3","A1","♠7","♠11","♣1","A5","♣3","♠3","♥12","♦7","♦12"]],"chien":["♣10","♥1","A16","EX","A17","♥2"],"date":1793359785529,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":156,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359786824}]},{"id":"T4-04","n":4,"dealer":3,"hands":[["♠6","♠8","♠14","♦2","A7","A9","A14","A16","A20","♥2","♥4","♥5","♥12","♥14","♣2","♣5","♣8","♣14"],["A12","A4","♦4","♠4","♦11","♥1","A6","A15","♠3","♥8","♠12","A2","♦14","♦7","♦8","A3","A19","♠11"],["A18","♦6","♣11","♣13","♦10","A5","A10","♣10","♦5","EX","♠13","♥11","♦3","♥13","♠10","A17","♠9","♣9"],["♣6","A11","A8","♠5","♥10","♠7","♣7","A1","♦9","♣3","A13","A21","♣12","♥3","♦13","♠2","♥6","♠1"]],"chien":["♥9","♣1","♦12","♦1","♥7","♣4"],"date":1793359786973,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":127,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359788256}]},{"id":"T4-05","n":4,"dealer":0,"hands":[["♠2","♠3","♠11","♠14","♦2","♦3","♦10","♦12","A3","A11","A16","A19","A20","A21","♥2","♣1","♣11","♣13"],["♥11","A15","♦6","♠7","♣2","A10","A2","♠9","A1","♣12","♦14","♠1","♦13","♠4","♦7","A14","♥3","♦4"],["♥10","♥1","A13","♦1","♣7","♥14","♥12","♥13","♥8","A17","♣6","A4","♥5","♦11","A6","♦5","♣4","♠5"],["♣5","♣10","♠8","♠13","♥7","♦9","A12","♥4","A7","A18","A8","A9","♦8","♣14","A5","♣8","♣3","♥6"]],"chien":["♠6","EX","♣9","♠12","♠10","♥9"],"date":1793359788431,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":150,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359789723}]},{"id":"T4-06","n":4,"dealer":2,"hands":[["♠2","♠4","♠9","♦6","♦7","♦8","♦11","♦14","A12","A15","A16","A20","EX","♥4","♥6","♥7","♥11","♣2"],["♥10","♠11","♠13","♠6","♦3","A7","♣12","♥14","♦9","♥13","♠10","A17","A21","♣13","A14","A18","♥1","♦10"],["♠8","♦5","♠5","A3","♣4","♣14","♦2","♣10","♥8","♥2","♣3","A5","♣7","A11","♦13","♣6","♥12","♣11"],["♠14","♥9","A2","A4","♣8","♦4","A13","A1","♣9","♠12","A8","♦12","♠7","♠1","♥3","A19","A9","A6"]],"chien":["♣5","♣1","♠3","♥5","♦1","A10"],"date":1793359791193,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":125,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359792479}]},{"id":"T4-07","n":4,"dealer":0,"hands":[["♠3","♠7","♠10","♦6","♦10","♦13","♦14","A4","A8","A14","A18","A19","A20","♥1","♥4","♥12","♣9","♣11"],["A3","♣1","♣6","♠2","♦1","A11","♠12","♠1","♠9","♦3","A5","A13","♥2","A7","♣14","♥9","♦12","A1"],["♠4","♣4","♦9","♦2","A16","♥13","♣3","A10","♦5","♣2","♠6","♥3","♣5","♦11","♣10","♠14","♣12","A21"],["A2","♠5","♦8","♥14","♥8","A15","EX","♠13","♥6","♦4","♣7","♥11","A9","A17","♥7","A6","♦7","♥10"]],"chien":["A12","♠8","♠11","♣13","♥5","♣8"],"date":1793359794015,"origin":{"contract":"garde","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":143,"role":"Défense","contract":"garde","takerName":"Léo","date":1793359795357}]},{"id":"T4-08","n":4,"dealer":2,"hands":[["♠2","♠3","♠4","♠9","♠10","♠13","♦6","♦9","♦11","A8","A11","A16","A17","A21","♥4","♣4","♣5","♣8"],["♠8","♣9","♣11","EX","♥11","♦14","♥13","♥5","♥6","♣1","♥8","A20","♦1","♥3","♠7","A10","♥12","A14"],["♥2","♠11","♥14","♦12","A13","A15","♥9","♦10","♣6","♥7","♥10","A5","♣14","A18","♦8","♣3","A9","♣12"],["♦4","♠14","♦13","A7","♥1","A1","♠5","A2","A19","♣13","♣7","A3","♠1","A6","♦3","♠12","♣10","A12"]],"chien":["♦7","♦2","A4","♦5","♣2","♠6"],"date":1793359802214,"origin":{"contract":"garde","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":132,"role":"Défense","contract":"garde","takerName":"Karim","date":1793359803558}]},{"id":"T4-09","n":4,"dealer":3,"hands":[["♠4","♠6","♦1","♦2","♦3","♦6","♦10","♦11","A1","A7","A10","A15","A19","♥5","♥9","♥10","♣1","♣5"],["♥8","A6","♦9","♣12","♠14","♣14","A8","♠8","A4","♥12","♥6","A13","♥2","♥4","EX","A17","A14","A3"],["A11","♣9","A20","♦12","♣13","A16","♣8","A21","♠12","♣2","♣7","♥1","♠5","♥7","♥11","♠3","♠13","♥13"],["♠2","A18","♦14","♠9","♠1","♠10","♦13","♣10","♣4","♣11","♠11","♦8","♦4","A12","A5","♣6","A9","♦7"]],"chien":["♣3","♠7","A2","♥3","♦5","♥14"],"date":1793359809372,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-363,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359810525}]},{"id":"T4-10","n":4,"dealer":1,"hands":[["♠1","♠4","♠6","♠11","♠13","♠14","♦1","A3","A5","A9","A10","A21","♥3","♥6","♣1","♣9","♣10","♣11"],["A7","A6","♦11","♠8","EX","♣12","A1","A18","♦9","♠9","♠10","♦2","♦12","♦14","♦6","♥11","♠7","♥10"],["♦13","♣14","♦5","♠12","A16","A17","A15","♥1","A12","A20","A2","♠2","A11","A13","♦7","♣6","♠3","A4"],["♣13","♥7","♥12","♥13","♥4","♥14","♦3","♣3","♠5","♥8","♥9","♣2","A19","♥2","♦10","♦4","♦8","♥5"]],"chien":["♣4","♣7","♣8","A8","♣5","A14"],"date":1793359778094,"origin":{"contract":"gs","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":268,"role":"Défense","contract":"gs","takerName":"Léo","date":1793359779291}]},{"id":"T4-11","n":4,"dealer":2,"hands":[["♠2","♠3","♠9","♦1","♦9","♦14","A3","A5","A6","A9","A12","A20","♥2","♥5","♥6","♥9","♣1","♣2"],["♦8","♥11","A14","♠14","♠1","♥14","♣12","A19","♥4","♣13","♥13","A17","♣6","♠11","♦2","♥3","EX","♣4"],["♣8","A2","A11","A10","A18","♦13","♥8","♠4","♣10","♦3","♥1","♠10","A8","♥10","♣3","♣14","♠12","A13"],["A4","♠8","♥7","♥12","A16","♠7","A21","♦4","A1","A7","♦10","♣11","♣7","♦6","♠5","♦7","♠13","♣9"]],"chien":["♦5","♣5","♦11","♠6","♦12","A15"],"date":1793359779475,"origin":{"contract":"gs","taker":"Karim","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":234,"role":"Défense","contract":"gs","takerName":"Karim","date":1793359780902}]},{"id":"T4-12","n":4,"dealer":1,"hands":[["♠3","♠5","♠9","♠10","♦2","♦4","♦8","A10","A16","♥4","♥12","♣2","♣4","♣7","♣8","♣10","♣11","♣14"],["A6","♥14","♠11","♥1","A8","♠6","A7","A19","A20","A14","A2","♠7","♦5","A5","A12","EX","♥2","♣3"],["♠14","♦9","A18","♠13","A9","♥7","♦11","♦10","♠2","A21","♦14","♠8","♦7","♦12","♦6","A15","♥8","♥11"],["♥3","♦13","♦3","♥13","♣9","A17","♥5","♣1","A3","A11","♠4","A13","♥6","♠12","A1","♣13","♠1","♣6"]],"chien":["♣12","♥10","♥9","A4","♦1","♣5"],"date":1793359789877,"origin":{"contract":"gs","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":112,"role":"Défense","contract":"gs","takerName":"Léo","date":1793359791016}]}],"5":[{"id":"T5-01","n":5,"dealer":3,"hands":[["♠1","♦3","♦10","♦13","A2","A7","A14","A16","♥1","♥5","♥10","♣1","♣4","♣5","♣11"],["♦8","♣13","♣8","♥8","A21","♠6","♦4","EX","A3","♣12","♠11","♦1","A8","♠5","♠14"],["♣10","♣2","A19","♣6","♠2","A15","♠3","A6","A11","A9","♦6","A1","♦12","♥12","♥4"],["♠12","♥6","♦7","♣9","A5","A20","♠9","A10","A17","♦9","♥3","A18","♠8","♥14","A12"],["♣7","♦14","A4","♠4","♣14","♦5","A13","♥2","♠13","♠7","♦2","♥13","♠10","♥9","♦11"]],"chien":["♥11","♣3","♥7"],"date":1793359838677,"origin":{"contract":"garde","taker":"Nadia","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-69,"role":"Défense","contract":"garde","takerName":"Nadia","date":1793359839923}]},{"id":"T5-02","n":5,"dealer":0,"hands":[["♠1","♠3","♠7","♦1","♦10","♦13","♦14","A4","A5","A12","A13","A21","♥2","♥11","♣2"],["♦9","♠13","♦12","A14","♠8","A3","♥14","A19","♠11","A7","♠2","♣11","♠10","♠5","♣9"],["A9","♥8","A2","A6","♣12","♥3","♠12","♠6","A8","A1","♥13","♣4","♣13","♠9","♣10"],["♦3","♥7","♦8","♣5","♠14","♥5","♣7","♥9","A18","♥12","♥6","♦11","♠4","A17","♣1"],["♣3","A10","♣6","A11","♣14","♦5","♦4","♦7","♥1","EX","♥10","♣8","♦6","♦2","♥4"]],"chien":["A20","A16","A15"],"date":1793359841289,"origin":{"contract":"garde","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":62,"role":"Appelé","contract":"garde","takerName":"Léo","date":1793359842585}]},{"id":"T5-03","n":5,"dealer":1,"hands":[["♠3","♠7","♦3","♦5","♦7","♦10","A1","A8","A11","A12","A17","♥8","♥12","♣12","♣14"],["♥1","♥10","♥14","♣6","A20","♠14","A7","♦6","A9","A15","♠6","A4","♦13","♦8","♣5"],["A19","♠1","♥4","♦4","♣1","♣2","♦2","♦11","A10","♣9","♦12","A14","♣11","♥2","♣8"],["♦9","A16","♠12","A18","♦14","♣13","♥3","♣4","♠5","♥7","A5","A2","EX","♥6","♠10"],["♣10","A3","♠11","♠4","♥5","A6","♥13","A13","A21","♥11","♣3","♠13","♦1","♥9","♣7"]],"chien":["♠8","♠2","♠9"],"date":1793359849520,"origin":{"contract":"garde","taker":"Sacha","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-96,"role":"Appelé","contract":"garde","takerName":"Sacha","date":1793359850866}]},{"id":"T5-04","n":5,"dealer":2,"hands":[["♠14","♦1","♦2","♦4","♦6","♦10","♦11","A4","A6","A13","A16","A18","♥5","♥8","♣7"],["♠10","♦3","♣1","♠4","A10","♦7","♣11","♥3","A8","♥2","A7","♣4","♥11","♠1","♣5"],["♦9","A3","A9","♥6","♠5","♥13","A11","♠7","♦8","♣13","EX","♥4","♦5","A1","♥7"],["♦12","♥14","♦14","♥9","♣6","♣8","♥12","♣10","A19","♣3","♠11","♥1","♣14","A2","A15"],["♠6","♣12","A12","♠9","♣2","A20","♣9","♠13","♠12","A17","♠8","♥10","A5","A14","♠2"]],"chien":["♠3","A21","♦13"],"date":1793359851008,"origin":{"contract":"garde","taker":"Sacha","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-51,"role":"Appelé","contract":"garde","takerName":"Sacha","date":1793359852305}]},{"id":"T5-05","n":5,"dealer":3,"hands":[["♠1","♠2","♠4","♠8","♠9","♦12","♦14","A1","EX","♥6","♥11","♥13","♣5","♣9","♣12"],["♣2","♥5","♥3","A4","A16","♠11","♠6","♦5","♦6","♥2","A10","♠12","A3","♦4","♣6"],["A11","A13","♥10","♦11","♥14","♠10","♣1","A6","A19","A8","♣10","A9","A18","A2","♥4"],["♥9","♦8","♦2","♠3","♠14","A7","♥12","A15","A17","♦3","♠13","A20","♣4","♦13","A14"],["♦7","♠7","♥7","♣13","♣8","♣7","♣11","♠5","♣14","♣3","♥1","♦10","♦1","♥8","♦9"]],"chien":["A5","A21","A12"],"date":1793359852469,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":180,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359853783}]},{"id":"T5-06","n":5,"dealer":0,"hands":[["♠9","♠11","♦6","♦8","♦12","♦13","A2","A6","A15","A17","A18","♥12","♣10","♣12","♣14"],["A10","A19","A14","♥11","♦4","♠2","♥6","♦9","♠4","A16","♠13","♥9","♦2","A3","♥13"],["♠10","♣8","♥10","♣9","A4","♣4","♦14","A5","A9","♠14","♥8","♥7","♣6","A7","EX"],["♠3","♣2","♥4","A1","♣13","♦11","♣7","♦1","A13","♣1","♠5","♣5","♠1","♥1","♦7"],["♣11","♣3","A11","♥5","♦10","♦5","A12","♠12","♦3","A20","♠7","♥14","A21","♥3","♠8"]],"chien":["A8","♥2","♠6"],"date":1793359855198,"origin":{"contract":"garde","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-68,"role":"Défense","contract":"garde","takerName":"Léo","date":1793359856459}]},{"id":"T5-07","n":5,"dealer":1,"hands":[["♠2","♠11","♦1","♦2","♦5","A4","A12","A14","A17","♥2","♥4","♣1","♣4","♣5","♣6"],["♠13","♥9","♦11","♠10","A1","A16","♣3","A18","♥10","♥13","A8","EX","♠9","A2","♠7"],["A6","♥8","A7","♥1","♠8","♦7","♠12","♠1","A10","♣8","A5","♣7","♣14","A9","A11"],["♠14","♦8","♥5","A13","A15","♦4","♥7","♥3","♥6","♥12","A20","♥14","A21","♣2","♣13"],["♦10","♠5","♠4","♥11","♦3","♦14","♣12","♦9","♦13","♦6","♣10","A19","♠3","♠6","♣11"]],"chien":["♦12","♣9","A3"],"date":1793359856604,"origin":{"contract":"garde","taker":"Sacha","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":59,"role":"Défense","contract":"garde","takerName":"Sacha","date":1793359857972}]},{"id":"T5-08","n":5,"dealer":2,"hands":[["♠6","♠14","♦3","♦4","♦6","♦10","♦11","A2","A3","A13","EX","♥6","♥7","♥10","♥11"],["♣10","♦13","A20","♦5","♥12","♦7","♥14","♣3","♥9","♠5","A12","A1","♠2","♣8","A10"],["♥5","A8","A16","♥13","♦2","♥3","♥1","♣9","♥8","♥2","♣1","A18","A21","♣2","♠7"],["♣5","♣4","♠4","♦14","♠11","♠9","A11","♦1","A19","♣13","♣7","♠12","♠8","A6","♠10"],["♣11","♦12","♥4","A4","♠13","♠3","A17","A15","♣14","♦8","A14","♣6","A5","♠1","♦9"]],"chien":["♣12","A9","A7"],"date":1793359858112,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":204,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359859306}]},{"id":"T5-09","n":5,"dealer":3,"hands":[["♠8","♠10","♠13","♦5","♦6","♦7","♦8","♦9","A10","A12","A16","A18","A20","EX","♥14"],["♠7","♦13","♥6","♥8","♠3","A11","♣7","A19","♦1","A6","♥13","♣14","A1","♥2","♥11"],["A5","♦4","♣10","A9","♣1","♠12","A7","♥4","♥10","♠4","A21","♣8","♥1","♣2","A15"],["♣3","A14","♦12","A2","♣5","♦2","♠6","♦14","A13","♠14","♦3","A4","♠1","♦10","♣12"],["♥7","♦11","A3","♥9","♥12","♥3","♥5","A17","♠9","♣4","♠2","A8","♣13","♣11","♣9"]],"chien":["♠5","♣6","♠11"],"date":1793359859451,"origin":{"contract":"garde","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-140,"role":"Preneur","contract":"garde","takerName":"Robot témoin","date":1793359860659}]},{"id":"T5-10","n":5,"dealer":0,"hands":[["♠1","♠4","♠13","♦1","♦4","♦8","♦10","A3","A9","A17","♥4","♥8","♣1","♣5","♣12"],["♠14","♥3","♠11","♠8","♦3","A6","♣3","A7","♠3","A8","♥7","A10","A12","♣10","♥12"],["♦5","A14","♣11","A18","♦2","♣4","A2","A4","♦6","♣14","A11","A1","♥14","♠2","A19"],["♠7","♥9","♦13","♣13","♦9","EX","♥5","♦7","♠9","♦14","A16","♥10","♠10","♥2","♦11"],["♥1","♣9","♠5","♠12","♣6","A13","♥6","♠6","A15","♥13","♦12","♣8","A20","♣2","A21"]],"chien":["A5","♥11","♣7"],"date":1793359834318,"origin":{"contract":"gs","taker":"Léo","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-140,"role":"Défense","contract":"gs","takerName":"Léo","date":1793359835620}]},{"id":"T5-11","n":5,"dealer":2,"hands":[["♠7","♠9","♠12","♦12","A1","A3","A11","A14","EX","♥6","♥8","♥9","♣11","♣12","♣13"],["♥11","A8","♥14","♠5","♦1","♥7","♠11","♦7","A7","♥3","♣14","A21","A4","♣5","A17"],["A9","A13","♦5","♣7","A16","♣1","♣10","♠8","♦9","♠13","♥5","A12","A18","♠3","♠6"],["♥1","♦14","♥2","♠2","♦8","♦6","♣6","A20","♥12","♠4","♦10","A6","♣9","♥10","A2"],["♣2","♥4","A5","♦11","A19","A15","♦3","A10","♣4","♦4","♦2","♦13","♣3","♠14","♠1"]],"chien":["♠10","♣8","♥13"],"date":1793359837233,"origin":{"contract":"gs","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-396,"role":"Preneur","contract":"gs","takerName":"Robot témoin","date":1793359838523}]},{"id":"T5-12","n":5,"dealer":4,"hands":[["♠4","♠9","♠11","♠12","♦4","♦6","♦8","♦12","♦14","A10","A21","EX","♥7","♣6","♣9"],["♥1","♠8","♥13","♠1","A7","♥10","♣13","♥5","♥9","A13","♠6","♥6","♦3","♦9","♥14"],["♠10","A14","A4","♥3","♣5","A18","A12","♦7","♦10","♣4","A3","♦5","♣10","A17","♥11"],["♣11","A11","♠13","♥4","A2","A20","♣1","♥8","A9","♣2","♦2","♦11","♠7","♠3","A16"],["♦1","♣12","A1","♠14","♠5","A5","♥12","A19","♣14","♣7","♣8","♦13","♥2","A8","♣3"]],"chien":["♠2","A15","A6"],"date":1793359840051,"origin":{"contract":"gs","taker":"Robot témoin","by":"Robot témoin"},"results":[{"pid":"robot","pseudo":"Robot témoin","delta":-364,"role":"Preneur","contract":"gs","takerName":"Robot témoin","date":1793359841147}]}]};
const LEVEL_NAMES = {1:'débutant', 2:'intermédiaire', 3:'expérimenté'};

/* ---------- État global ---------- */
const G = {
  n:4, players:[], me:0, dealer:-1,
  phase:'idle',            // deal|bid|call|ecart|play|score
  chien:[], bids:[], taker:-1, contract:null, called:null, // called: {suit,rank}
  partner:-1, partnerKnown:false, alone:false,
  trick:[], trickLeader:0, turn:0, tricksWon:[],  // tricksWon[i] = [cards]
  ecart:[], petitAuBout:null, poignees:{}, chelemAnnounced:false,
  discardSel:new Set(), speed:1, music:null, musicOn:false,
  stats:null, paused:false,
};
// stockage local tolérant (certains navigateurs mobiles bloquent localStorage sur les fichiers)
const store={
  get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} },
  del:k=>{ try{ localStorage.removeItem(k); }catch(e){} },
};
/* ---------- Profils multiples sur un même navigateur (V1.2 — demande de Marc) ---------- */
function loadProfiles(){
  let list=null; try{ list=JSON.parse(store.get('tarot.profiles')||'null'); }catch(e){}
  if(!Array.isArray(list)){
    list=[];
    const old=store.get('tarot.profile'); // migration du profil unique V1.1
    if(old){ try{ const p=JSON.parse(old); p.id='p1'; list.push(p);
      [3,4,5].forEach(n=>{ const s=store.get('tarot.stats.'+n); if(s) store.set('tarot.stats.p1.'+n, s); });
      store.set('tarot.current','p1'); }catch(e){} }
    store.set('tarot.profiles', JSON.stringify(list));
  }
  return list;
}
let PROFILES = loadProfiles();
let PROFILE = PROFILES.find(p=>p.id===store.get('tarot.current')) || null;
if(AUTO) PROFILE = AUTO_DUP ? {id:'robot2', pseudo:'Robot 2', niveau:4, caractere:3} : {id:'robot', pseudo:'Robot témoin', niveau:4, caractere:3};
const savedProfile = !!PROFILE;
if(!PROFILE) PROFILE={id:null, pseudo:'Moi', niveau:3, caractere:3};
let EDIT = PROFILE; // profil affiché dans le formulaire
function saveProfiles(){ store.set('tarot.profiles', JSON.stringify(PROFILES)); }
const statsKey = ()=>'tarot.stats.'+(PROFILE.id||'anon')+'.'+G.n;
function loadStats(){ G.stats = JSON.parse(store.get(statsKey()) || '{"donnes":0,"prises":0,"reussies":0,"appele":0,"ptsPlus":0,"ptsMoins":0,"petitGagne":0,"petitPerdu":0,"poignees":0}'); }
function saveStats(){ store.set(statsKey(), JSON.stringify(G.stats)); }

/* ---------- Vivier de duplicate (V0 — règles validées le 30/10/2026) ----------
   · seules les donnes jouées en GARDE ou GARDE SANS entrent dans le vivier
   · un joueur ne reçoit JAMAIS deux fois la même donne (ni une donne qu'il a lui-même jouée)
   · enchères libres pour les joueurs suivants (Petite → Garde contre)
   · comparaison à poste égal : même main (siège « Moi »), même rôle */
const VIVIER_MAX = 400;
const vivierKey = n => 'tarot.vivier.'+n;
const seenKey = () => 'tarot.seen.'+(PROFILE.id||'anon');
function loadVivier(n){ try{ return JSON.parse(store.get(vivierKey(n))||'[]'); }catch(e){ return []; } }
function saveVivier(n, v){ store.set(vivierKey(n), JSON.stringify(v.slice(-VIVIER_MAX))); }
function loadSeen(){ try{ return new Set(JSON.parse(store.get(seenKey())||'[]')); }catch(e){ return new Set(); } }
function markSeen(id){ const s=loadSeen(); s.add(id); store.set(seenKey(), JSON.stringify([...s])); }
function ensureSeeds(){
  if(AUTO || store.get('tarot.seeded.v12')) return;
  [3,4,5].forEach(n=>{
    const v=loadVivier(n); const ids=new Set(v.map(d=>d.id));
    (SEED_VIVIER[n]||[]).forEach(d=>{ if(!ids.has(d.id)) v.unshift(JSON.parse(JSON.stringify(d))); });
    saveVivier(n, v);
  });
  store.set('tarot.seeded.v12','1');
}
function dupAvailable(n){ const seen=loadSeen(); return loadVivier(n).filter(d=>!seen.has(d.id)); }
function pickDuplicate(n){ const pool=dupAvailable(n); return pool.length? pool[Math.floor(Math.random()*pool.length)] : null; }
const newDealId = n => 'D'+n+'-'+Date.now().toString(36).slice(-4).toUpperCase()+Math.random().toString(36).slice(2,4).toUpperCase();

/* ---------- Cartes ---------- */
function buildDeck(){
  const d = [];
  for(const s of ['♠','♥','♦','♣']) for(let r=1;r<=14;r++)
    d.push({kind:'suit', suit:s, rank:r, pts: r===14?4.5 : r===13?3.5 : r===12?2.5 : r===11?1.5 : 0.5, id:s+r});
  for(let a=1;a<=21;a++)
    d.push({kind:'atout', num:a, pts:(a===1||a===21)?4.5:0.5, id:'A'+a});
  d.push({kind:'excuse', pts:4.5, id:'EX'});
  return d; // 78
}
const isBout = c => c.kind==='excuse' || (c.kind==='atout' && (c.num===1||c.num===21));
const isPetit = c => c.kind==='atout' && c.num===1;
const cardName = c => c.kind==='excuse' ? "L'Excuse — ★ bout"
  : c.kind==='atout' ? (c.num===1?`Le Petit — atout 1 · ★ bout` : c.num===21?`Le 21 — atout · ★ bout` : `Atout ${c.num}`)
  : `${RANK_LABEL[c.rank]||c.rank} de ${SUIT_NAME[c.suit]} ${c.suit}${isBout(c)?' · ★ bout':''}`;
function sortHand(h){
  h.sort((a,b)=>{
    const ka = a.kind==='suit' ? SUIT_ORDER.indexOf(a.suit)*100 + a.rank : SUIT_ORDER.indexOf('A')*100 + (a.kind==='atout'?a.num:22);
    const kb = b.kind==='suit' ? SUIT_ORDER.indexOf(b.suit)*100 + b.rank : SUIT_ORDER.indexOf('A')*100 + (b.kind==='atout'?b.num:22);
    return ka-kb;
  });
}
const sumPts = cards => cards.reduce((s,c)=>s+c.pts,0);
const atouts = h => h.filter(c=>c.kind==='atout');
const rois   = h => h.filter(c=>c.kind==='suit'&&c.rank===14);
const bouts  = h => h.filter(isBout);
const rnd = a => a[Math.floor(Math.random()*a.length)];

/* ---------- Journal / toast / clochette ---------- */
function logEv(txt){
  const j = $('#journal'); const d = document.createElement('div');
  d.className='ev'; d.textContent = txt; j.appendChild(d);
  while(j.children.length>5) j.removeChild(j.firstChild);
}
let toastTimer=null;
function toast(txt, ms=1800){
  const t=$('#toast'); t.textContent=txt; t.style.opacity=1;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.style.opacity=0, ms);
}
let audioCtx=null;
function bell(){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value=1174;
    g.gain.setValueAtTime(.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.22, audioCtx.currentTime+.02);
    g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime+.7);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+.75);
  }catch(e){}
  try{ if(!AUTO && navigator.vibrate) navigator.vibrate(70); }catch(e){} // petit vibreur quand c'est à toi (comme Tarot Classic)
  $('#bell').hidden=false; clearTimeout(bell._t); bell._t=setTimeout(()=>$('#bell').hidden=true, 2600);
}
/* ---------- Musique d'ambiance synthétisée (boucle légère) ---------- */
function toggleMusic(){
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if(G.musicOn){ G.musicOn=false; if(G.music) G.music.forEach(n=>{try{n.stop()}catch(e){}}); G.music=null; }
    else{
      G.musicOn=true;
      const master=audioCtx.createGain(); master.gain.value=.045; master.connect(audioCtx.destination);
      const chords=[[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]];
      let step=0;
      const nodes=[];
      const tick=()=>{
        if(!G.musicOn) return;
        const ch=chords[step%4]; step++;
        ch.forEach((f,i)=>{
          const o=audioCtx.createOscillator(), g=audioCtx.createGain();
          o.type='triangle'; o.frequency.value=f*(i===0?0.5:1);
          g.gain.setValueAtTime(.0001,audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(.8,audioCtx.currentTime+.4);
          g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+2.8);
          o.connect(g).connect(master); o.start(); o.stop(audioCtx.currentTime+3);
          nodes.push(o);
        });
        G.musicTimer=setTimeout(tick, 2000);
      };
      tick(); G.music=nodes;
    }
  }catch(e){}
  $('#music-state').textContent = G.musicOn?'on':'off';
}
/* ================================================================
   DÉMARRAGE D'UNE TABLE
   ================================================================ */
function pickBots(){
  // niveau auto-évalué → composition de la table
  const niv = PROFILE.niveau;
  let levels;
  if(niv<=2)      levels = [1,1,1,1];            // Découverte
  else if(niv<=4) levels = [1,2,2,3];            // Club
  else            levels = [2,3,3,3];            // Compétition
  const pool = [...BOT_POOL].sort(()=>Math.random()-.5);
  const bots=[];
  for(let i=0;i<G.n-1;i++){
    const b=pool[i%pool.length];
    bots.push({...b, level: levels[Math.min(i,3)] || b.level});
  }
  return bots;
}
function setupPlayers(){
  const bots = pickBots();
  G.players = [{name:PROFILE.pseudo||'Moi', emoji:'🙂', color:'#c94f3d', level:AUTO?3:0, human:!AUTO}];
  bots.forEach(b=>G.players.push(b));
  G.me=0;
}
function seatAngles(n){
  // Moi en bas au centre ; ordre de jeu ANTIHORAIRE (sens FFT — retour Marc du 30/10) :
  // le joueur qui suit est à ma DROITE, puis on tourne vers le haut et la gauche.
  if(n===3) return [90, 330, 210];
  if(n===4) return [90, 0, 270, 180];
  return [90, 18, 306, 234, 162]; // 72° réguliers
}
/* ---------- Mise en page adaptative (ordinateur, tablette, Z Fold, téléphone paysage) ---------- */
const L={};
function layout(){
  const W=window.innerWidth, H=window.innerHeight;
  const btn = H<=520 ? 36 : 44;
  const railW=Math.round(Math.max(140, Math.min(210, W*0.15)));
  const perRow=Math.max(1, Math.floor((railW+6)/(btn+6)));
  const tbH=Math.ceil(6/perRow)*(btn+6);
  const ch=Math.round(Math.max(62, Math.min(150, H*0.165, W*0.11)));  // cartes nettement plus grandes qu'en V1.1
  const cw=Math.round(ch*0.69);
  const areaW=W-railW-24;
  const handH=ch*1.5;                       // place réservée à la main, entièrement visible
  const top=12, bottomLimit=H-handH;
  const seatM=Math.max(44, Math.min(78, ch*0.5));
  let fh=Math.max(120, (bottomLimit-top-seatM*1.6)*0.82);   // table resserrée (retour Marc)
  let fw=Math.min(areaW*0.62, areaW-2*seatM-40, fh*2.0);
  fh=Math.min(fh, fw/1.45);
  const cx=12+areaW/2;
  const cy=Math.max(top+seatM+fh/2, (top+seatM*0.9 + bottomLimit-seatM*0.25)/2);
  Object.assign(L,{W,H,railW,ch,cw,fw,fh,cx,cy,seatM});
  const r=document.documentElement.style;
  r.setProperty('--card-w',cw+'px'); r.setProperty('--card-h',ch+'px');
  r.setProperty('--felt-w',fw+'px'); r.setProperty('--felt-h',fh+'px');
  r.setProperty('--felt-x',cx+'px'); r.setProperty('--felt-y',cy+'px');
  r.setProperty('--rail-w',railW+'px'); r.setProperty('--tb-h',tbH+'px');
  r.setProperty('--pivot',Math.round(ch*3.4)+'px');
  r.setProperty('--av',Math.round(Math.max(40,Math.min(60,ch*0.46)))+'px');
}
function seatPos(angleDeg, isMe){
  const a=angleDeg*Math.PI/180;
  if(isMe) return {x:L.cx, y:L.cy+L.fh/2-4};
  const rx=L.fw/2+L.seatM*0.95, ry=L.fh/2+L.seatM*0.7;
  return {x:L.cx+rx*Math.cos(a), y:L.cy+ry*Math.sin(a)};
}
function renderSeats(){
  layout();
  const box=$('#seats'); box.innerHTML='';
  const angles=seatAngles(G.n);
  for(let i=0;i<G.n;i++){
    const p=G.players[i];
    const pos=seatPos(angles[i], i===G.me);
    const el=document.createElement('div');
    el.className='seat'+(i===G.me?' me':''); el.id='seat-'+i;
    el.style.left=pos.x+'px'; el.style.top=pos.y+'px';
    el.style.setProperty('--sc', p.color);
    el.innerHTML=`<div class="avatar">${p.emoji}<span class="role-crown" id="crown-${i}" hidden></span></div>
      <div class="nm">${p.name}</div>`;
    box.appendChild(el);
  }
  renderSlots(angles);
  renderCrowns();
}
function renderSlots(angles){
  const box=$('#slots'); box.innerHTML='';
  for(let i=0;i<G.n;i++){
    const a=seatAngles(G.n)[i]*Math.PI/180;
    const pos={x:L.cx+L.fw*0.27*Math.cos(a), y:L.cy+L.fh*0.25*Math.sin(a)};
    const el=document.createElement('div');
    el.className='slot'; el.id='slot-'+i;
    el.style.left=pos.x+'px'; el.style.top=pos.y+'px';
    box.appendChild(el);
  }
  renderTrick();
}
/* ---------- Rendu des cartes ---------- */
function cardEl(c, small=false){
  const el=document.createElement('div');
  el.className='card';
  if(c.kind==='suit'){
    el.classList.add((c.suit==='♥'||c.suit==='♦')?'red':'black');
    const rl = c.rank>10? {11:'V',12:'C',13:'D',14:'R'}[c.rank] : c.rank;
    el.innerHTML=`<div class="corner">${rl}<span class="s">${c.suit}</span></div>
      <div class="pip">${c.suit}</div>
      <div class="corner br">${rl}<span class="s">${c.suit}</span></div>`;
  }else if(c.kind==='atout'){
    el.classList.add('atout');
    el.innerHTML=`<div class="frame"></div>
      <div class="corner" style="color:#8a6d1a;">${c.num}<span class="s">✦</span></div>
      <div class="tnum">${c.num}${isBout(c)?' <span class="star">★</span>':''}</div>
      <div class="corner br" style="color:#8a6d1a;">${c.num}<span class="s">✦</span></div>`;
  }else{
    el.classList.add('excuse');
