"use strict";

const cds = require("@sap/cds");

const parserService = require("../services/parser-service");
const persistenceService = require("../services/persistence-service");

const { INSERT } = cds.ql;

function requireFileName(value, req) {
    const normalizedValue = typeof value === "string" ? value.trim() : "";

    if (!normalizedValue) {
        req.reject(400, "fileName is required.");
    }

    return normalizedValue;
}

function requireContent(value, req) {
    const content = typeof value === "string" ? value : "";

    if (!content.trim()) {
        req.reject(400, "content is required.");
    }

    return content;
}

module.exports = cds.service.impl(function () {
    const entities = this.entities;

    this.on("processFile", async (req) => {
        const fileName = requireFileName(req.data.fileName, req);
        const content = requireContent(req.data.content, req);

        const parseResult = parserService.parse(content);
        const fileId = cds.utils.uuid();
        const tx = cds.transaction(req);

        await tx.run(
            INSERT.into(entities.Files).entries({
                ID: fileId,
                fileName,
                content,
                totalWords: parseResult.totalWords,
                uniqueWords: parseResult.uniqueWords
            })
        );

        await persistenceService.persistParseResult({
            tx,
            entities,
            fileId,
            parseResult
        });

        return {
            fileId,
            fileName,
            totalWords: parseResult.totalWords,
            uniqueWords: parseResult.uniqueWords
        };
    });
});
