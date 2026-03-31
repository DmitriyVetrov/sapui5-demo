"use strict";

const WORD_SEPARATOR_REGEX = /[^\p{L}\p{N}\s]+/gu;
const WHITESPACE_REGEX = /\s+/u;
const LETTER_REGEX = /\p{L}/gu;

function normalizeText(content) {
    return String(content || "")
        .toLocaleLowerCase()
        .replace(WORD_SEPARATOR_REGEX, " ")
        .trim();
}

function extractWords(content) {
    const normalizedText = normalizeText(content);

    if (!normalizedText) {
        return [];
    }

    return normalizedText
        .split(WHITESPACE_REGEX)
        .map((token) => token.trim())
        .filter(Boolean);
}

function countWords(words) {
    const counters = new Map();

    for (const word of words) {
        const currentCounter = counters.get(word) || 0;
        counters.set(word, currentCounter + 1);
    }

    return Array.from(counters.entries())
        .map(([word, counter]) => ({
            word,
            normalizedWord: word,
            length: Array.from(word).length,
            counter
        }))
        .sort((left, right) => {
            if (right.counter !== left.counter) {
                return right.counter - left.counter;
            }

            return left.normalizedWord.localeCompare(right.normalizedWord);
        });
}

function countLetters(content) {
    const normalizedText = normalizeText(content);
    const letters = normalizedText.match(LETTER_REGEX) || [];
    const counters = new Map();

    for (const letter of letters) {
        const currentCounter = counters.get(letter) || 0;
        counters.set(letter, currentCounter + 1);
    }

    return Array.from(counters.entries())
        .map(([letter, counter]) => ({
            letter,
            counter
        }))
        .sort((left, right) => left.letter.localeCompare(right.letter));
}

function parse(content) {
    const extractedWords = extractWords(content);
    const words = countWords(extractedWords);
    const letters = countLetters(content);

    return {
        totalWords: extractedWords.length,
        uniqueWords: words.length,
        words,
        letters
    };
}

module.exports = {
    normalizeText,
    extractWords,
    tokenize: extractWords,
    countWords,
    countLetters,
    parse
};
