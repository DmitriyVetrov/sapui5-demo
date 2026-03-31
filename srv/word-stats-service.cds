using { sap.cap.demo.wordstats as db } from '../db/schema';

@path : '/word-stats'
service WordStatsService {
    entity Files as projection on db.Files;
    entity Words as projection on db.Words;
    entity WordCounters as projection on db.WordCounters;
    entity AlphabetStats as projection on db.AlphabetStats;

    action processFile(
        fileName : String,
        content  : LargeString
    ) returns ProcessFileSummary;
}

type ProcessFileSummary {
    fileId      : UUID;
    fileName    : String;
    totalWords  : Integer;
    uniqueWords : Integer;
}
