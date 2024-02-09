countries = {
    "Spanish": "eu-ES",
    "Bulgarian": "bg-BG",
    "Catalonian": "ca-ES",
    "Chinesse": "cmn-Hans-CN",
    "Croatian": "hr_HR",
    "Czechian": "cs-CZ",
    "Danish": "da-DK",
    "English": "en-US",
    "French": "fr-FR",
    "German": "de-DE",
    "Greek": "el-GR",
    "Finish": "fi-FI",
    "Hebrew": "he-IL",
    "Hindi": "hi-IN",
    "Hungarian": "hu-HU",
    "Indonesian": "id-ID",
    "Japanesse": "ja-JP",
    "Korean": "ko-KR",
    "Lithuanian": "lt-LT",
    "Malaysian": "ms-MY",
    "Dutch": "nl-NL",
    "Norwegian": "nb-NO",
    "Polish": "pl-PL",
    "Portuguese": "pt-PT",
    "Romanian": "ro-RO",
    "Russian": "ru-RU",
    "Serbian": "sr-RS",
    "Slovakian": "sk-SK",
    "Slovenian": "sl-SI",
    "Spanish": "es-ES",
    "Swedish": "sv-SE",
    "Turkish": "tr-TR",
    "Ukrainian": "uk-UA"
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function findClosestMatch(searchStr) {
    const words = searchStr.split(" ");
    const word = words[words.length - 1];
    const search = capitalizeFirstLetter(word);
    return countries[search] || countries["English"]
}
