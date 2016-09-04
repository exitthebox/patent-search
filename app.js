// Load http module.
var http = require('http'),
    bluemix = require('./config/bluemix'),
    extend = require('util')._extend,
    watson = require('watson-developer-cloud'),
    async  = require('async'),
    favicon = require('serve-favicon'),        
    path = require('path'),
    
    express = require('express');
    
// Initialize app object.
var app = new express();
// Bootstrap application settings
require('./config/express')(app);

app.use(favicon(__dirname + '/public/images/favicon.ico'));

// if bluemix credentials exists, then override local
var credentials = extend({
  url: 'https://gateway.watsonplatform.net/concept-insights/api',
  username: WATSON_CI_username,
  password: WATSON_CI_password,
  version: 'v2'
}, bluemix.getServiceCreds('concept_insights')); // VCAP_SERVICES

//var corpus_id = process.env.CORPUS_ID || '/corpora/public/TEDTalks';
var corpus_id = process.env.CORPUS_ID;
var graph_id  = process.env.GRAPH_ID;
//console.log("corpus_id:" + corpus_id);

// Create the service wrapper
credentials.jar = true;
var conceptInsights = watson.concept_insights(credentials);

app.get('/api/corpusStats', function(req, res, next) {
    var params = extend({
    corpus: corpus_id,
    prefix: true,
    concepts: true
  }, req.query);
  
 conceptInsights.corpora.getCorpusStats(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });   
});


app.get('/api/labelSearch', function(req, res, next) {
  var params = extend({
    corpus: corpus_id,
    prefix: true,
    limit: 10,
    concepts: true
  }, req.query);

  conceptInsights.corpora.searchByLabel(params, function(err, results) {
    if (err)
      return next(err);
    else
      res.json(results);
  });
});

app.get('/api/conceptualSearch', function(req, res, next) {
        //console.log("app.get conceptualSearch event");
  var params = extend({ corpus: corpus_id, limit: 10 }, req.query);
  conceptInsights.corpora.getRelatedDocuments(params, function(err, data) {
    if (err)
      return next(err);
    else {
      async.parallel(data.results.map(getPassagesAsync), function(err, documentsWithPassages) {
        if (err)
          return next(err);
        else{
          data.results = documentsWithPassages;
          res.json(data);
          //console.log("app.get conceptualSearch data"+data);
        }
      });
    }
  });
});

app.post('/api/extractConceptMentions', function(req, res, next) {
    //console.log("app.post event");
  var params = extend({ graph: graph_id }, req.body);
  conceptInsights.graphs.annotateText(params, function(err, results) {
    if (err){
        console.log("app.post error:"+err);
      return next(err);
  }
    else{
      res.json(results);
        //console.log("app.post result:"+JSON.stringify(results, null, 2));
    }
  });
});

app.use(express.static(path.join(__dirname , './public'))); 
// Use app.set to add the view engine.
// Ass app is an express object, it has a view engine property.
app.set('view engine', 'jade');
  
// Set path to views.
app.set('views',  __dirname + '/views');
 
// Basic routing.
app.get('/', function(req, res) {
    // res.send is changed to result.render in order to load the correct view.
    res.render('index');
});

/**
 * Builds an Async function that get a document and call crop the passages on it.
 * @param  {[type]} doc The document
 * @return {[type]}     The document with the passages
 */
var getPassagesAsync = function(doc) {
  return function (callback) {
    conceptInsights.corpora.getDocument(doc, function(err, fullDoc) {
      if (err)
        callback(err);
      else {
        doc = extend(doc, fullDoc);
        doc.explanation_tags.forEach(crop.bind(this, doc));
        delete doc.parts;
        callback(null, doc);
      }
    });
  };
};

/**
 * Crop the document text where the tag is.
 * @param  {Object} doc The document.
 * @param  {Object} tag The explanation tag.
 */
var crop = function(doc, tag){
  var textIndexes = tag.text_index;
  var documentText = doc.parts[tag.parts_index].data;

  var anchor = documentText.substring(textIndexes[0], textIndexes[1]);
  var left = Math.max(textIndexes[0] - 100, 0);
  var right = Math.min(textIndexes[1] + 100, documentText.length);

  var prefix = documentText.substring(left, textIndexes[0]);
  var suffix = documentText.substring(textIndexes[1], right);

  var firstSpace = prefix.indexOf(' ');
  if ((firstSpace !== -1) && (firstSpace + 1 < prefix.length))
      prefix = prefix.substring(firstSpace + 1);

  var lastSpace = suffix.lastIndexOf(' ');
  if (lastSpace !== -1)
    suffix = suffix.substring(0, lastSpace);

  tag.passage = '...' + prefix + '<b>' + anchor + '</b>' + suffix + '...';
};

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);