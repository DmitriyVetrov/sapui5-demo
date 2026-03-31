Implementation details

#Phase 5
Implemented [word-stats-service.js](/home/dmytro/git/sapui5-demo/srv/word-stats-service.js).

Request flow from `processFile` to persistence:

1. The CAP action `processFile` receives `fileName` and `content`.
2. The handler validates both inputs and rejects the request with `400` if either is empty.
3. It calls the separate parser module in [parser-service.js](/home/dmytro/git/sapui5-demo/services/parser-service.js), which returns:
   - `totalWords`
   - `uniqueWords`
   - `words`
   - `letters`
4. The handler generates a new `fileId` and inserts one `Files` record with:
   - `ID`
   - `fileName`
   - `content`
   - `totalWords`
   - `uniqueWords`
5. It then calls [persistence-service.js](/home/dmytro/git/sapui5-demo/services/persistence-service.js) with:
   - the CAP transaction
   - entity references
   - the new `fileId`
   - the parser result
6. The persistence service reuses or creates `Words`, then inserts the related `WordCounters` and `AlphabetStats` rows for that file.
7. The handler returns the summary response:
   - `fileId`
   - `fileName`
   - `totalWords`
   - `uniqueWords`

The CAP handler stays thin here: validation, orchestration, and response shaping only.