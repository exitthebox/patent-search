/* global derived_concept_list_item */

'use strict';
// var jsonQuery = require('json-query');

$(document).ready(function() {
console.log("doc.ready()");
$('._content--loading').css('display', 'none');
  // jquery dom variables

  /**
   * Helper functions for displaying autocompletion results
   */
  var getType = function(id) {
    return id.match(/^\/graphs/) ? 'concept' : 'document';
  };
  var trunc = function(s) {
    if (typeof s !== 'string') {
      return '';
    }
    return s.length > 40 ? s.substring(0, 50) + '...' : s;
  };
  var conceptSuggestion = function(d) {
    if (getType(d.id) === 'concept') {
      return '<div><strong>' + d.label + '</strong> <i class=\'pull-right\'>' +
        getType(d.id) + '</i><br><i class="concept-abstract">' + trunc(d.abstract) + '</i></div>';
    } else {
      return '<div><strong>' + d.label + '</strong> <i class=\'pull-right\'>' +
        getType(d.id) + '</i></div>';
    }
  };

  var pendingSuggestion = function(query) {
    return '<div class="tt--search-hint"><i>Searching for ' + query.query + '</i></div>';
  }

  /**
   * Event handler for tab changes
   */
  $('.tab-panels--tab').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var inputGroup = self.closest('.tab-panels');
    var idName = null;

    inputGroup.find('.tab-panels--tab.active').removeClass('active');
    inputGroup.find('.tab-panels--tab-pane.active').removeClass('active');
    self.addClass('active');
    idName = self.attr('href');
    $(idName).addClass('active');
    $('.input--API').removeClass('active');
    $('.input--endpoint').removeClass('active');
    $(idName + '-endpoint').addClass('active');
    $('._demo--output').css('display', 'none');
  });

  /**
   * Event handler for concept tabs
   */
  $('.concept--new-concept-container').click(function(e) {
    e.preventDefault();
    var self = $(this);
    var concept = self.closest('.concept');

    concept.find('.active').removeClass('active');
    concept.find('.concept--input-container').addClass('active');
    concept.find('.concept--input').focus();
  });

  /**
   * Event handler for auto complete
   */
  $('.concept--input').citypeahead({
    selectionCb: selectionCallback,
    hint: false
  }, {
    templates: {
      suggestion: conceptSuggestion,
      pending: pendingSuggestion
    },
    source: sourceLabelSearch
  });

  $('.concept--input').keyup(function (e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13){
      console.log($('.tt-suggestion').first().attr('class'));
      $('.tt-suggestion').first().addClass('tt-cursor');

    }
  });

  var query_data = '';

  function sourceLabelSearch(query, callback) {
    query_data = query;
    return $.get('/api/labelSearch', {
      query: query,
      limit: 7,
      concept_fields: JSON.stringify({
        abstract: 1
      })
    }).done(function(results) {
      $('#concepts-panel-API-data').empty();
      $('#concepts-panel-API-data').html(JSON.stringify(results, null, 2));
      $('#label-search-view-code-btn').removeAttr('disabled');
      $('#label-search-view-code-btn').prev().removeClass('icon-code-disabled');

      if(results.matches.length == 0){
        $('.tt-dataset').html('<div class="tt--search-hint"><i>no concepts found</i></div>');
      }

      var filtered = {};
      filtered['matches'] = results.matches.filter(function(elem) {
        return elem.id.match(/^\/graphs/);
      });
      callback(filtered);
    }).fail(function(error) {
      // console.log('sourceLabelSearch.error:',error)
    });
  }

  function selectionCallback(concept) {
    var label = concept.label;
    var $template = $('.concept').last().clone();

    $template.find('.label').text(label);
    $template.find('.label').attr('concept_id', concept.id);
    $template.find('.concept--close-icon').click(function() {
      $(this).closest('.concept').remove();
      fetch_hyena_based_on_concepts();
    });
    $template.insertBefore('.concept:nth-last-child(1)');

    $('.concept:nth-last-child(1) > .concept--input-container').empty();
    $('.concept:nth-last-child(1) > .concept--input-container')
      .html('<input class="concept--input" type="text">');

    $('.concept--input').citypeahead({
      selectionCb: selectionCallback,
      hint: false
    }, {
      templates: {
        suggestion: conceptSuggestion,
        pending: pendingSuggestion
      },
      source: sourceLabelSearch
    });

    $('.concept--input').keyup(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13){
        console.log($('.tt-suggestion').first().attr('class'));
        $('.tt-suggestion').first().addClass('tt-cursor');

      }
    });

    $('.concept:nth-last-child(1) > .concept--input-container').removeClass('active');
    $('.concept:nth-last-child(1) > .concept--new-concept-container').addClass('active');

    fetch_hyena_based_on_concepts();
  }

  /**
   * Event handler for reset button
   */
  $('.reset-button').click(function(){
    location.reload();
  });

  /**
   * Event handler for using sample text
   */
//  $('#sample-1').click(function(){
//    $.ajax({
//        url : '../data/declaration.txt',
//        dataType: "text",
//        success : function (data) {
//            $("#body-of-text").text(data);
//            getAbstractConcepts();
//        }
//    });
//  });
//
//  $('#sample-2').click(function(){
//    $.ajax({
//        url : '../data/emmewatson.txt',
//        dataType: "text",
//        success : function (data) {
//            $("#body-of-text").text(data);
//            getAbstractConcepts();
//        }
//    });
//  });



});

function show_label_search_response() {
  $('#concepts-panel-API').toggleClass('active');
}

function show_text_annotator_response() {
  $('#text-panel-API').toggleClass('active');
}

function show_conceptual_search_response() {
  $('#hyena-code-container').toggleClass('active');
}

function fetch_hyena_based_on_concepts() {
    
    //use this function to perform the drill-down. Need to clean up and remove left over TED code
    
  var concept_array = [];
  var input_concept_labels = [];
  var $user_input_concepts = $('.concept--input-concept-list > .concept > .concept--typed-concept-container > .concept--typed-concept');
  for (var i = 0; i < ($user_input_concepts.length < 3 ? $user_input_concepts.length : 3); i++) {
    concept_array.push($('.concept--input-concept-list > .concept > .concept--typed-concept-container > .concept--typed-concept:eq(' + i + ')').attr('concept_id'));
    input_concept_labels.push($('.concept--input-concept-list > .concept > .concept--typed-concept-container > .concept--typed-concept:eq(' + i + ')').text());
  }

  $('._demo--output').css('display', 'none');
  $('._content--loading').show();

  $.get('/api/conceptualSearch', {
      ids: concept_array,
      limit: 3,
      document_fields: JSON.stringify({
        user_fields: 1
      })
    })
    .done(function(results) {

      $('#hyena-panel-API-data').empty();
      $('#hyena-panel-API-data').html(JSON.stringify(results, null, 2));

      $('#hyena-panel-list').empty();
      for (var i = 0; i < results.results.length; i++)
          generate_hyena_panel(results.results[i], input_concept_labels);
    }).fail(function(error) {
      error = error.responseJSON ? error.responseJSON.error : error.statusText;
      console.log('error:', error);
    }).always(function() {

      $('._content--loading').css('display', 'none');
      $('._demo--output').show();

      var top = document.getElementById('try-this-service').offsetTop;
      window.scrollTo(0, top);

    });

}

var typingTimer;
var doneTypingInterval = 500;  // .5 second
var $input = $('#body-of-text');

//on keyup, start the countdown
$input.on('keyup', function () {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(getAbstractConcepts, doneTypingInterval);
});

//on keydown, clear the countdown
$input.on('keydown', function () {
  clearTimeout(typingTimer);
});

var previousText = '';
function getAbstractConcepts() {
    console.log("getAbstractConcepts()...");
  var text = $('#body-of-text').text();
  text = text.length > 0 ? text : ' ';
  if(text != previousText){
    $.post('/api/extractConceptMentions', {
        text: text
      })
      .done(function(results) {
        console.log("Annotations returned..");
        //console.log("text: "+ text);
        $('.concept--abstract-concept-list').empty();

        var unique_concept_array = [];

        if (results.annotations.length)
          $('.concept--abstract-concept-title').addClass('active');

        for (var i = 0; i < results.annotations.length; i++) {
          if (check_duplicate_concept(unique_concept_array, results.annotations[i].concept.id) || unique_concept_array.length == 3)
            continue;
          else
            unique_concept_array.push(results.annotations[i].concept.id);

          var abstract_concept_div = '<div class="concept--abstract-concept-list-container"><span class="concept--abstract-concept-list-item" concept_id="' + results.annotations[i].concept.id + '">' + results.annotations[i].concept.label + '</span></div>';
          $('.concept--abstract-concept-list').append(abstract_concept_div);
        }

        $('#text-panel-API-data').empty();
        $('#text-panel-API-data').html(JSON.stringify(results, null, 2));
        $('#text-annotator-view-code-btn').removeAttr('disabled');
        $('#text-annotator-view-code-btn').prev().removeClass('icon-code-disabled');

        var concept_array = [];
        var input_concept_labels = [];
        for (var i = 0; i < (results.length < 3 ? results.length : 3); i++) {
          //concept_array.push($('.concept--abstract-concept-list-item:eq(' + i + ')').attr('concept_id'));
          concept_array.push(results.annotations[i].concept.id);
          //input_concept_labels.push($('.concept--abstract-concept-list-item:eq(' + i + ')').text());
          input_concept_labels.push(results.annotations[i].concept.label);
        }

        $('#hyena-panel-API-data').empty();
        $('#hyena-panel-list').empty();
        if (concept_array.length > 0) {
          $('._demo--output').css('display', 'none');
          $('._content--loading').show();

          $.get('/api/conceptualSearch', {
              ids: concept_array,
              limit: 3,
              document_fields: JSON.stringify({
                user_fields: 1
              })
            })
            .done(function(results) {

              $('#hyena-panel-API-data').empty();
              $('#hyena-panel-API-data').html(JSON.stringify(results, null, 2));

              $('#hyena-panel-list').empty();
              for (var i = 0; i < results.results.length; i++){
                generate_hyena_panel(results.results[i], input_concept_labels);
              };
              generate_hyena_header_panel(input_concept_labels);
            }).fail(function(error) {
              error = error.responseJSON ? error.responseJSON.error : error.statusText;
              console.log('error:', error);
            }).always(function() {
              $('._content--loading').css('display', 'none');
              $('._demo--output').show();

             // var top = document.getElementById('try-this-service').offsetTop;
              window.scrollTo(0, top);
            });
        }

      }).fail(function(error) {
        error = error.responseJSON ? error.responseJSON.error : error.statusText;
        console.log('extractConceptMentions error:', error);
      }).always(function() {

      });
      previousText = text;
    }
}

function check_duplicate_concept(unique_concept_array, concept) {
  for (var i = 0; i < unique_concept_array.length; i++) {
    if (unique_concept_array[i] == concept)
      return true;
  }

  return false;
}
function generate_hyena_header_panel(input_concepts){
    console.log("generate_hyena_header_panel..");
    $.jade.set_globals( { 
        input_concept1: input_concepts[0],
        input_concept2: input_concepts[1],
        input_concept3: input_concepts[2] 
    } );
    
    $('#hyena-panel-header').append( $.jade(
     
        'div.panel.panel-default',[
           'div.panel-heading',[
               'div.row',[
                   'div.font-box Concepts discovered in your search '],
               'div.row',[
                   'p',
                   'span.col-md-4.floating-box !{input_concept1}',
                   'span.col-md-4.floating-box !{input_concept2}',
                   'span.col-md-4.floating-box !{input_concept3}',
                   'br'],
                ]
           ]   
     
    ));
};
function concept_stats(concept, tag_mentions){
    
    $.get('/api/corpusStats', {
//        ids: concept_array,
//        limit: 3,
//        document_fields: JSON.stringify({
//          user_fields: 1
        })
   //need to finish below code 5/31/2016
      .done(function(results) {
          
       function findStats(results) { 
            return results.top_tags.tags.concept === concept;
}

        console.log(results.find(findStats)); // { name: 'cherries', quantity: 5 }
       
      }).fail(function(error) {
        error = error.responseJSON ? error.responseJSON.error : error.statusText;
        console.log('error:', error);
      }).always(function() {
//        $('._content--loading').css('display', 'none');
//        $('._demo--output').show();
//
//       // var top = document.getElementById('try-this-service').offsetTop;
//        window.scrollTo(0, top);
      });
    
};
function generate_hyena_panel(hyena_data, input_concepts) {
    console.log("generate_hyena_panel..");
    //console.log("generate_hyena_panel()...");
    //console.log("hyena_data: "+JSON.stringify(hyena_data, null, 2));
    var hyena_panel = hyena_data;

    var title;
    var owner;
    var patentDoc;
    var derived_concept_list_item = [];
    
    //$('#hyena-panel-list').append(JSON.stringify(input_concepts, null, 2));
      for (var i = 0; i < 3; i++) {
          derived_concept_list_item.push(hyena_data.explanation_tags[i].concept.label);
          console.log('hyena_data.explanation_tags[i].concept.label');
      };
    
    $.jade.set_globals( { 
        title: title, 
        owner: hyena_data.user_fields.org, 
        patentDoc: hyena_data.user_fields.patent,
        input_concept1: input_concepts[0],
        input_concept2: input_concepts[1],
        input_concept3: input_concepts[2],
        derived_concept1: derived_concept_list_item[0],
        derived_concept2: derived_concept_list_item[1],
        derived_concept3: derived_concept_list_item[2],
        passage: hyena_data.explanation_tags[0].passage,
        passage2: hyena_data.explanation_tags[1].passage,
        passage3: hyena_data.explanation_tags[2].passage,
        tableStyle: '.table(style=\'width:100%\')' } );
    
    $('#hyena-panel-header1').append( $.jade(
     'div.panel.panel-default',[
        'div.panel-heading.p',[
            '| Concepts from your search that match concepts discovered in patent claim text listed below',    
            'br',
            '| For more information on how you can use this type of searching on your data, visit',
            'www.smallpondsoftware.com'],
        ]    
    ));
    $('#hyena-panel-list').append( $.jade(
      
      'div.panel.panel-default', [
        'div.panel-heading.p', [
            'strong Patent Title: #{title}',
            'br',
            'strong Patent Owner: !{owner}',
            'br',
            'strong Patent Document: !{patentDoc}'],
        'div.panel-body',[
            'p.concept-box-desc.my-boxes',[
                '| Concepts derived from your search text that match patent concepts are listed below along with the matching claim text from the patent listed above',    
                'br'],
            'div.container-fluid',[
                'div.row',[
                    'div.col-lg-4.col-sm-2.ouput-concept-box.my-boxes !{derived_concept1}'],
                'div.row',[
                    'div.col-lg-12.ouput-concept-box-passage.my-boxes !{passage}',
                    'div.col-lg-4.col-sm-2.ouput-concept-box.my-boxes !{derived_concept2}'],
                'div.row',[
                    'div.col-lg-12.ouput-concept-box-passage.my-boxes !{passage2}',
                    'div.col-lg-4.col-sm-2.ouput-concept-box.my-boxes !{derived_concept3}'],
                'div.row',[
                    'div.col-lg-12.ouput-concept-box-passage.my-boxes !{passage3}'
                ]
                
            ]
                
        ]
            
    ]
           
         
      
    ) );
    
    $('#hoverclass td').hover(function() {
        $(this).addClass('hover');
    }, function() {
        $(this).removeClass('hover');
    });

//  $('.concept--derived-concept').click(function(e) {
//    e.preventDefault();
//    var self = $(this);
//    var how_it_works = self.closest('._hyena-panel--how-it-works');
//    var index = self.attr('data-index');
//
//    how_it_works.find('.concept--derived-concept.active').removeClass('active');
//    self.addClass('active');
//    how_it_works.find('.how-it-works--passage.active').removeClass('active');
//    how_it_works.find('.how-it-works--passage-list').children().eq(index).addClass('active');
//  });
//
//  $('.concept--derived-concept').hover(function(e) {
//    e.preventDefault();
//    var self = $(this);
//    var how_it_works = self.closest('._hyena-panel--how-it-works');
//    var index = self.attr('data-index');
//
//    how_it_works.find('.concept--derived-concept.active').removeClass('active');
//    self.addClass('active');
//    how_it_works.find('.how-it-works--passage.active').removeClass('active');
//    how_it_works.find('.how-it-works--passage-list').children().eq(index).addClass('active');
//  });

}
