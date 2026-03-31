"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const parserService = require("../services/parser-service");

test("normalizeText lowercases text and removes punctuation", () => {
    const normalized = parserService.normalizeText("Hello, SAP CAP! Ready?");

    assert.equal(normalized, "hello sap cap ready");
});

test("extractWords splits normalized text by whitespace and ignores empty tokens", () => {
    const words = parserService.extractWords("  Hello,\n\nSAP\tCAP   hello  ");

    assert.deepEqual(words, ["hello", "sap", "cap", "hello"]);
});

test("countWords groups repeated words and sorts by counter desc then alphabetically", () => {
    const counts = parserService.countWords(["sap", "cap", "sap", "ui5", "cap", "sap"]);

    assert.deepEqual(counts, [
        {
            word: "sap",
            normalizedWord: "sap",
            length: 3,
            counter: 3
        },
        {
            word: "cap",
            normalizedWord: "cap",
            length: 3,
            counter: 2
        },
        {
            word: "ui5",
            normalizedWord: "ui5",
            length: 3,
            counter: 1
        }
    ]);
});

test("countLetters counts only alphabetic characters and supports Unicode letters", () => {
    const letters = parserService.countLetters("Ärger, Ärger! SAP 123");

    assert.deepEqual(letters, [
        { letter: "a", counter: 1 },
        { letter: "ä", counter: 2 },
        { letter: "e", counter: 2 },
        { letter: "g", counter: 2 },
        { letter: "p", counter: 1 },
        { letter: "r", counter: 4 },
        { letter: "s", counter: 1 }
    ]);
});

test("parse returns the expected structure for mixed case input", () => {
    const result = parserService.parse("Hello, hello SAP!");

    assert.deepEqual(result, {
        totalWords: 3,
        uniqueWords: 2,
        words: [
            {
                word: "hello",
                normalizedWord: "hello",
                length: 5,
                counter: 2
            },
            {
                word: "sap",
                normalizedWord: "sap",
                length: 3,
                counter: 1
            }
        ],
        letters: [
            { letter: "a", counter: 1 },
            { letter: "e", counter: 2 },
            { letter: "h", counter: 2 },
            { letter: "l", counter: 4 },
            { letter: "o", counter: 2 },
            { letter: "p", counter: 1 },
            { letter: "s", counter: 1 }
        ]
    });
});

test("parse handles empty input", () => {
    const result = parserService.parse("");

    assert.deepEqual(result, {
        totalWords: 0,
        uniqueWords: 0,
        words: [],
        letters: []
    });
});

test("parse handles punctuation-only input", () => {
    const result = parserService.parse("...!!!???---");

    assert.deepEqual(result, {
        totalWords: 0,
        uniqueWords: 0,
        words: [],
        letters: []
    });
});

test("parse supports Unicode words and letters", () => {
    const result = parserService.parse("Žlutý kůň žlutý");

    assert.equal(result.totalWords, 3);
    assert.equal(result.uniqueWords, 2);
    assert.deepEqual(result.words, [
        {
            word: "žlutý",
            normalizedWord: "žlutý",
            length: 5,
            counter: 2
        },
        {
            word: "kůň",
            normalizedWord: "kůň",
            length: 3,
            counter: 1
        }
    ]);
    assert.deepEqual(result.letters, [
        { letter: "k", counter: 1 },
        { letter: "l", counter: 2 },
        { letter: "ň", counter: 1 },
        { letter: "t", counter: 2 },
        { letter: "u", counter: 2 },
        { letter: "ů", counter: 1 },
        { letter: "ý", counter: 2 },
        { letter: "ž", counter: 2 }
    ]);
});
