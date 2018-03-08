const htmlToJson = require("html-to-json");
var fs = require("fs");

function getCurrentDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1; // "+ 1" becouse the 1st month is 0
  var day = date.getDate();
  var hour = date.getHours();
  var minutes = date.getMinutes();
  var secconds = date.getSeconds();

  return (
    year + "" + month + "" + day + "-" + hour + "" + minutes + "" + secconds
  );
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key];
    var y = b[key];
    return y - x;
  });
}

class Scrap {
  constructor() {
    this.min = 1;
    this.max = 10;
    this.projects = [];
  }

  parseResults(fileName) {
    var obj = JSON.parse(fs.readFileSync(fileName, "utf8"));
    return sortByKey(obj, "votesCount");
  }

  async scrapProjects() {
    var i = this.min;
    var that = this;
    for (var i = that.min; i <= that.max; i++) {
      let result = await this.getProject(i);
      if (result.project != "") {
        that.projects.push(result);
      }
    }
    return that.projects;
  }

  getProject(id, callback) {
    return htmlToJson.request(
      {
        uri: "https://lafabrique-france.aviva.com/voting/projet/vue/30-" + id
      },
      {
        project: function($project) {
          return $project
            .find(".project-details h1")
            .text()
            .replace("\\n", "")
            .trim();
        },
        organisation: function($project) {
          return $project
            .find(".project-top-container h2")
            .text()
            .replace("\\n", "")
            .trim();
        },
        votesCount: function($doc) {
          var val = $doc.find(".votes-count").html();
          return val && val != undefined && val != ""
            ? Number(val.replace(/&#xA0;/g, ""))
            : null;
        },
        url: function() {
          return (
            "https://lafabrique-france.aviva.com/voting/projet/vue/30-" + id
          );
        }
      },
      callback
    );
  }
}

var scrap = new Scrap();
scrap.scrapProjects().then(res => {
  var htmlFileName = "./index.html";
  var results = sortByKey(res, "votesCount");
  fs.writeFile(
    htmlFileName,
    "<html><head><link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css\" integrity=\"sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm\" crossorigin=\"anonymous\"></head><body><table class='table'><thead class='thead-dark'><tr><th scope='col'>#</th><th scope='col'>Vote</th><th scope='col'>Project</th><th scope='col'>Company</th><th scope='col'><small>Date: " +
      getCurrentDate() +
      "</small></th></tr></thead>"
  );
  for (var i = 0; i < results.length; i++) {
    var orga = results[i].organisation.toLowerCase();
    fs.appendFile(
      htmlFileName,
      "<tr class='" +
        (orga == "courseur" || orga == "jeanne rives"
          ? "table-danger"
          : i < 140 ? "table-success" : "") +
        "'><th scope='row'>" +
        (i + 1) +
        "</th><td>" +
        results[i].votesCount +
        "</td><td>" +
        results[i].project +
        "</td><td>" +
        results[i].organisation +
        "</td><td><a href='" +
        results[i].url +
        "' target='_blank' class='btn btn-light'>Open</a></td></tr>"
    );
  }
});
