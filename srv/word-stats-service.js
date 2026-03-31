"use strict";

const cds = require("@sap/cds");

const parserService = require("../services/parser-service");
const persistenceService = require("../services/persistence-service");

const { INSERT } = cds.ql;

function requireNonEmptyString(value, fieldName, req) {
    const normalizedValue = typeof value === "string" ? value.trim() : "";

    if (!normalizedValue) {
        req.reject(400, `${fieldName} is required.`);
    }

    return normalizedValue;
}

module.exports = cds.service.impl(function () {
    const entities = this.entities;

    this.on("processFile", async (req) => {
        const fileName = requireNonEmptyString(req.data.fileName, "fileName", req);
        const content = requireNonEmptyString(req.data.content, "content", req);

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
