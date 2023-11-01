// eslint-disable-next-line
const supportedBrowsers = /((CPU[ +]OS|iPhone[ +]OS|CPU[ +]iPhone|CPU IPhone OS)[ +]+(9[_\.]3|9[_\.]([4-9]|\d{2,})|([1-9]\d|\d{3,})[_\.]\d+|11[_\.]0|11[_\.]([1-9]|\d{2,})|11[_\.]2|11[_\.]([3-9]|\d{2,})|(1[2-9]|[2-9]\d|\d{3,})[_\.]\d+|12[_\.]0|12[_\.]([1-9]|\d{2,})|12[_\.]4|12[_\.]([5-9]|\d{2,})|(1[3-9]|[2-9]\d|\d{3,})[_\.]\d+|13[_\.]0|13[_\.]([1-9]|\d{2,})|(1[4-9]|[2-9]\d|\d{3,})[_\.]\d+)(?:[_\.]\d+)?)|(CFNetwork\/8.* Darwin\/16\.5\.\d+)|(CFNetwork\/8.* Darwin\/16\.6\.\d+)|(CFNetwork\/8.* Darwin\/16\.7\.\d+)|(CFNetwork\/8.* Darwin\/17\.0\.\d+)|(CFNetwork\/8.* Darwin\/17\.2\.\d+)|(CFNetwork\/8.* Darwin\/17\.3\.\d+)|(CFNetwork\/8.* Darwin\/17\.\d+)|(SamsungBrowser\/(7\.2|7\.([3-9]|\d{2,})|7\.4|7\.([5-9]|\d{2,})|([8-9]|\d{2,})\.\d+|9\.2|9\.([3-9]|\d{2,})|([1-9]\d|\d{3,})\.\d+|10\.1|10\.([2-9]|\d{2,})|(1[1-9]|[2-9]\d|\d{3,})\.\d+))|(Edge\/(17(?:\.0)?|17(?:\.([1-9]|\d{2,}))?|(1[8-9]|[2-9]\d|\d{3,})(?:\.\d+)?))|(HeadlessChrome((?:\/49\.0\.\d+)?|(?:\/49\.([1-9]|\d{2,})\.\d+)?|(?:\/([5-9]\d|\d{3,})\.\d+\.\d+)?|(?:\/63\.0\.\d+)?|(?:\/63\.([1-9]|\d{2,})\.\d+)?|(?:\/(6[4-9]|[7-9]\d|\d{3,})\.\d+\.\d+)?|(?:\/69\.0\.\d+)?|(?:\/69\.([1-9]|\d{2,})\.\d+)?|(?:\/([7-9]\d|\d{3,})\.\d+\.\d+)?))|((Chromium|Chrome)\/(49\.0|49\.([1-9]|\d{2,})|([5-9]\d|\d{3,})\.\d+|63\.0|63\.([1-9]|\d{2,})|(6[4-9]|[7-9]\d|\d{3,})\.\d+|69\.0|69\.([1-9]|\d{2,})|([7-9]\d|\d{3,})\.\d+)(?:\.\d+)?([\d.]+$|.*Safari\/(?![\d.]+ Edge\/[\d.]+$)))|(Version\/(5\.1|5\.([2-9]|\d{2,})|([6-9]|\d{2,})\.\d+|11\.1|11\.([2-9]|\d{2,})|(1[2-9]|[2-9]\d|\d{3,})\.\d+|12\.0|12\.([1-9]|\d{2,})|(1[3-9]|[2-9]\d|\d{3,})\.\d+|13\.0|13\.([1-9]|\d{2,})|(1[4-9]|[2-9]\d|\d{3,})\.\d+)(?:\.\d+)?.*Safari\/)|(Trident\/7\.0)|(Firefox\/(52\.0|52\.([1-9]|\d{2,})|(5[3-9]|[6-9]\d|\d{3,})\.\d+|68\.0|68\.([1-9]|\d{2,})|(69|[7-9]\d|\d{3,})\.\d+|70\.0|70\.([1-9]|\d{2,})|(7[1-9]|[8-9]\d|\d{3,})\.\d+)\.\d+)|(Firefox\/(52\.0|52\.([1-9]|\d{2,})|(5[3-9]|[6-9]\d|\d{3,})\.\d+|68\.0|68\.([1-9]|\d{2,})|(69|[7-9]\d|\d{3,})\.\d+|70\.0|70\.([1-9]|\d{2,})|(7[1-9]|[8-9]\d|\d{3,})\.\d+)(pre|[ab]\d+[a-z]*)?)|(([MS]?IE) (11\.0|11\.([1-9]|\d{2,})|(1[2-9]|[2-9]\d|\d{3,})\.\d+))/;
export default supportedBrowsers;