sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageToast) => {
    "use strict";

    const SERVICE_BASE_PATH = "/odata/v4/word-stats";

    return Controller.extend("vietrov.projectvietrov.controller.ViewMain", {
        onInit() {
            this._selectedFile = null;
            this.getView().setModel(new JSONModel({
                busy: false,
                hasSelectedFile: false,
                selectedFileName: "",
                status: {
                    text: "",
                    type: "Information"
                },
                summary: {
                    fileId: "",
                    fileName: "",
                    totalWords: 0,
                    uniqueWords: 0
                },
                wordStats: [],
                alphabetStats: []
            }), "view");
            this._setStatus("Choose a text file to start parsing.", "Information");
        },

        onFileChange(oEvent) {
            const aFiles = oEvent.getParameter("files") || [];
            const oFile = aFiles[0] || null;
            const oViewModel = this.getView().getModel("view");

            this._selectedFile = oFile;
            oViewModel.setProperty("/hasSelectedFile", !!oFile);
            oViewModel.setProperty("/selectedFileName", oFile ? oFile.name : "");
            oViewModel.setProperty("/summary", {
                fileId: "",
                fileName: "",
                totalWords: 0,
                uniqueWords: 0
            });
            oViewModel.setProperty("/wordStats", []);
            oViewModel.setProperty("/alphabetStats", []);

            if (oFile) {
                this._setStatus("File selected. Press Process to parse and store it.", "Success");
                return;
            }

            this._setStatus("Please choose a text file.", "Information");
        },

        async onProcessFile() {
            const oViewModel = this.getView().getModel("view");

            if (!this._selectedFile) {
                this._setStatus("Choose a .txt file before processing.", "Error");
                return;
            }

            oViewModel.setProperty("/busy", true);
            this._setStatus("Processing file...", "Information");

            try {
                const sContent = await this._readSelectedFile(this._selectedFile);
                const oSummary = await this._processFile(this._selectedFile.name, sContent);

                oViewModel.setProperty("/summary", oSummary);

                const [aWordStats, aAlphabetStats] = await Promise.all([
                    this._loadWordStats(oSummary.fileId),
                    this._loadAlphabetStats(oSummary.fileId)
                ]);

                oViewModel.setProperty("/wordStats", aWordStats);
                oViewModel.setProperty("/alphabetStats", aAlphabetStats);

                this._setStatus("File processed successfully.", "Success");
                MessageToast.show("Parsing completed.");
            } catch (error) {
                this._setStatus(error.message || "Processing failed.", "Error");
            } finally {
                oViewModel.setProperty("/busy", false);
            }
        },

        _readSelectedFile(oFile) {
            return new Promise((resolve, reject) => {
                const oReader = new FileReader();

                oReader.onload = () => {
                    resolve(String(oReader.result || ""));
                };

                oReader.onerror = () => {
                    reject(new Error("Could not read the selected file."));
                };

                oReader.readAsText(oFile, "UTF-8");
            });
        },

        async _processFile(sFileName, sContent) {
            return this._fetchJson(`${SERVICE_BASE_PATH}/processFile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fileName: sFileName,
                    content: sContent
                })
            });
        },

        async _loadWordStats(sFileId) {
            const oResponse = await this._fetchJson(this._buildServiceUrl("WordCounters", {
                "$expand": "word($select=word)",
                "$select": "counter,file_ID",
                "$filter": `file_ID eq ${sFileId}`,
                "$orderby": "counter desc"
            }));

            return (oResponse.value || []).map((oEntry) => ({
                word: oEntry.word?.word || "",
                counter: oEntry.counter
            }));
        },

        async _loadAlphabetStats(sFileId) {
            const oResponse = await this._fetchJson(this._buildServiceUrl("AlphabetStats", {
                "$select": "letter,counter,file_ID",
                "$filter": `file_ID eq ${sFileId}`,
                "$orderby": "counter desc,letter asc"
            }));

            return oResponse.value || [];
        },

        _buildServiceUrl(sEntityOrAction, mQueryOptions) {
            if (!mQueryOptions) {
                return `${SERVICE_BASE_PATH}/${sEntityOrAction}`;
            }

            const oSearchParams = new URLSearchParams(mQueryOptions);
            return `${SERVICE_BASE_PATH}/${sEntityOrAction}?${oSearchParams.toString()}`;
        },

        async _fetchJson(sUrl, mOptions) {
            const oResponse = await fetch(sUrl, mOptions);
            const oResult = await oResponse.json().catch(() => ({}));

            if (!oResponse.ok) {
                throw new Error(
                    oResult.error?.message?.value ||
                    oResult.error?.message ||
                    oResult.error ||
                    "Request failed."
                );
            }

            return oResult;
        },

        _setStatus(sText, sType) {
            this.getView().getModel("view").setProperty("/status", {
                text: sText,
                type: sType
            });
        }
    });
});
