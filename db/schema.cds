using { cuid, managed } from '@sap/cds/common';

namespace sap.cap.demo.wordstats;

entity Files : cuid, managed {
    fileName     : String(255);
    content      : LargeString;
    totalWords   : Integer;
    uniqueWords  : Integer;

    wordCounters : Composition of many WordCounters on wordCounters.file = $self;
    alphabetStats : Composition of many AlphabetStats on alphabetStats.file = $self;
}

entity Words : cuid, managed {
    word           : String(255);
    normalizedWord : String(255);
    length         : Integer;

    wordCounters   : Association to many WordCounters on wordCounters.word = $self;
}

entity WordCounters : cuid, managed {
    file    : Association to Files not null;
    word    : Association to Words not null;
    counter : Integer not null;
}

entity AlphabetStats : cuid, managed {
    file    : Association to Files not null;
    letter  : String(1) not null;
    counter : Integer not null;
}
