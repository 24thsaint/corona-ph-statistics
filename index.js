const Axios = require("axios");

let lastStats = {};

function normalize(text) {
  return text.substring(0, 1).toUpperCase() + text.substring(1);
}

function calculateDifference(before, now) {
  if (!before) {
    return "-";
  }
  if (before === now) {
    return "0";
  }
  if (now > before) {
    return `+${now - before}`;
  } else {
    return `-${before - now}`;
  }
}

async function run() {
  const statisticsRequest = await Axios.get(
    "https://services5.arcgis.com/mnYJ21GiFTR97WFg/arcgis/rest/services/slide_fig/FeatureServer/0/query?f=json&where=1=1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22deaths%22,%22outStatisticFieldName%22:%22deaths%22},%20{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22tests%22,%22outStatisticFieldName%22:%22tests%22},{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22recovered%22,%22outStatisticFieldName%22:%22recovered%22},{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22PUIs%22,%22outStatisticFieldName%22:%22PUIs%22},%20{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22PUMs%22,%22outStatisticFieldName%22:%22PUMs%22},{%22statisticType%22:%22sum%22,%22onStatisticField%22:%22confirmed%22,%22outStatisticFieldName%22:%22confirmed%22}]&cacheHint=true"
  );

  const statistics = statisticsRequest.data.features[0].attributes;

  const content = {
    attachments: [
      {
        fallback: "Corona PH Statistics",
        color: "#ff0000",
        author_name: "Corona PH Statistics",
        author_link: "https://github.com/24thsaint/corona-ph-statistics",
        text: "From ARC GIS, last 24 hours.",
        fields: [
          ...Object.keys(statistics).map(s => {
            return {
              title: `${normalize(s)} (${calculateDifference(
                lastStats[s],
                statistics[s]
              )})`,
              value: `${statistics[s]}`
            };
          })
        ],
        ts: new Date().getTime()
      }
    ]
  };

  lastStats = statistics;

  await Axios.post(
    `https://hooks.slack.com/services/${process.env.SLACK_INCOMING_URL}`,
    content
  );
}

const ONE_DAY = 3600 * 24;

setInterval(async () => {
  await run();
}, ONE_DAY);
