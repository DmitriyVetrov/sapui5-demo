"use strict";

const cds = require("@sap/cds");

const { SELECT, INSERT } = cds.ql;

function validateInput(tx, entities, fileId, parseResult) {
    if (!tx) {
        throw new Error("A CAP transaction object is required.");
    }

    if (!entities?.Words || !entities?.WordCounters || !entities?.AlphabetStats) {
        throw new Error("Entity references for Words, WordCounters, and AlphabetStats are required.");
    }

    if (!fileId) {
        throw new Error("A file ID is required.");
    }

    if (!parseResult) {
        throw new Error("A parse result is required.");
    }
}

async function fetchExistingWords(tx, Words, normalizedWords) {
    if (normalizedWords.length === 0) {
        return [];
    }

    return tx.run(
        SELECT.from(Words)
            .columns("ID", "normalizedWord")
            .where({ normalizedWord: { in: normalizedWords } })
    );
}

async function createMissingWords(tx, Words, parsedWords, existingWords) {
    const existingByNormalizedWord = new Map(
        existingWords.map((entry) => [entry.normalizedWord, entry])
    );

    const missingWords = parsedWords
        .filter((entry) => !existingByNormalizedWord.has(entry.normalizedWord))
        .map((entry) => ({
            word: entry.word,
            normalizedWord: entry.normalizedWord,
            length: entry.length
        }));

    if (missingWords.length > 0) {
        await tx.run(INSERT.into(Words).entries(missingWords));
    }
}

async function resolveWordsByNormalizedWord(tx, Words, parsedWords) {
    const normalizedWords = parsedWords.map((entry) => entry.normalizedWord);
    const existingWords = await fetchExistingWords(tx, Words, normalizedWords);

    await createMissingWords(tx, Words, parsedWords, existingWords);

    const persistedWords = await fetchExistingWords(tx, Words, normalizedWords);

    return new Map(
        persistedWords.map((entry) => [entry.normalizedWord, entry])
    );
}

async function insertWordCounters(tx, WordCounters, fileId, parsedWords, wordsByNormalizedWord) {
    if (parsedWords.length === 0) {
        return;
    }

    const entries = parsedWords.map((entry) => {
        const persistedWord = wordsByNormalizedWord.get(entry.normalizedWord);

        if (!persistedWord?.ID) {
            throw new Error(`Could not resolve word ID for "${entry.normalizedWord}".`);
        }

        return {
            file_ID: fileId,
            word_ID: persistedWord.ID,
            counter: entry.counter
        };
    });

    await tx.run(INSERT.into(WordCounters).entries(entries));
}

async function insertAlphabetStats(tx, AlphabetStats, fileId, letters) {
    if (!letters || letters.length === 0) {
        return;
    }

    const entries = letters.map((entry) => ({
        file_ID: fileId,
        letter: entry.letter,
        counter: entry.counter
    }));

    await tx.run(INSERT.into(AlphabetStats).entries(entries));
}

async function persistParseResult({ tx, entities, fileId, parseResult }) {
    validateInput(tx, entities, fileId, parseResult);

    const parsedWords = Array.isArray(parseResult.words) ? parseResult.words : [];
    const letters = Array.isArray(parseResult.letters) ? parseResult.letters : [];

    const wordsByNormalizedWord = await resolveWordsByNormalizedWord(
        tx,
        entities.Words,
        parsedWords
    );

    await insertWordCounters(
        tx,
        entities.WordCounters,
        fileId,
        parsedWords,
        wordsByNormalizedWord
    );

    await insertAlphabetStats(
        tx,
        entities.AlphabetStats,
        fileId,
        letters
    );

    return {
        wordCountersCreated: parsedWords.length,
        alphabetStatsCreated: letters.length
    };
}

module.exports = {
    fetchExistingWords,
    resolveWordsByNormalizedWord,
    insertWordCounters,
    insertAlphabetStats,
    persistParseResult
};
