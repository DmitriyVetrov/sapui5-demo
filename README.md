Implementation details
# Phase 6 UI Changes

This file explains the changes made for **Phase 6: UI** of the SAP CAP demo application.

## Goal of Phase 6

The goal was to create a simple SAPUI5/Fiori-style screen that lets a user:

- choose a plain text file
- send the file content to the CAP backend
- display the returned summary
- display word statistics
- display alphabet statistics

## Files Updated for Phase 6

- `webapp/view/ViewMain.view.xml`
- `webapp/controller/ViewMain.controller.js`
- `webapp/i18n/i18n.properties`
- `ui5.yaml`
- `ui5-local.yaml`

## UI Structure

The main view is split into **two sections**.

### 1. File Upload and Parsing

This section contains:

- a `FileUploader` for selecting a `.txt` file
- a selected file indicator
- a `Process File` button
- a `MessageStrip` for user status and error/success messages
- a summary panel that becomes visible after processing

The summary panel shows:

- file name
- total words
- unique words

### 2. Parsing Statistics Display

This section contains two tables:

- **Word Statistics**
  - column `Word`
  - column `Counter`
- **Alphabet Statistics**
  - column `Letter`
  - column `Counter`

The tables are bound to a local JSON view model and are filled after the backend processing finishes.

## Controller Logic

The upload and processing flow is handled in `webapp/controller/ViewMain.controller.js`.

### `onInit()`

Creates a local JSON model named `view` with:

- busy state
- selected file state
- status message data
- summary data
- word statistics array
- alphabet statistics array

### `onFileChange()`

Runs when the user selects a file.

It:

- stores the selected file in a controller variable
- updates the selected file name in the view model
- clears old summary/statistics data
- shows a status message

### `onProcessFile()`

Runs when the user clicks the process button.

It:

1. validates that a file is selected
2. reads the file content in the browser using `FileReader`
3. sends `fileName` and `content` to the CAP action:

   - `/odata/v4/word-stats/processFile`

4. stores the returned summary in the view model
5. loads related word statistics from `WordCounters`
6. loads related letter statistics from `AlphabetStats`
7. updates the tables and status message

## Backend Connection

The UI is connected to the CAP backend through plain `fetch()` calls.

The controller uses:

- `processFile` action for parsing and persistence
- `WordCounters` entity for word frequency results
- `AlphabetStats` entity for letter frequency results

To support local development, UI5 proxy settings were added in:

- `ui5.yaml`
- `ui5-local.yaml`

The proxy forwards requests from:

- `/odata`

to:

- `http://127.0.0.1:4004`

This allows the UI5 app to call the CAP backend without hardcoding a separate browser origin.

## i18n Texts

User-facing labels were added to `webapp/i18n/i18n.properties`, including:

- page title
- section titles
- button label
- table headers
- empty state texts
- summary labels

## Flex-Enabled Stable IDs

Because `flexEnabled` is set to `true` in `manifest.json`, stable control IDs are important.

For that reason, explicit IDs were added to the key controls in `ViewMain.view.xml`, including:

- uploader section controls
- summary attributes
- table columns
- table row template controls

This avoids the UI5 flex warning about controls having empty IDs.

## Styling

Styling was intentionally kept minimal and demo-friendly.

The layout uses standard SAPUI5 controls and spacing classes, with only light custom CSS for page width.

## Summary

Phase 6 adds a complete frontend flow for:

- selecting a text file
- sending it to the CAP backend
- showing processing feedback
- displaying summary statistics
- displaying detailed word and alphabet counts

The UI stays simple, readable, and close to standard SAPUI5/Fiori patterns.



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
