/* jshint node: true, browser: false */

// gulpfile to build examples not included in other gulpfiles

var gulp = require('gulp');
var es = require('event-stream');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var zip = require('gulp-zip');

var rootDirectory = __dirname + '/../../';
var exampleDirectory = rootDirectory + 'example/';
var distDirectory = rootDirectory + 'dist/';
var distMMDirectory = distDirectory + 'sdk/';

gulp.task('examples.multilingual-voice', ['sdk.concat'], function () {
  var mlmvDirectory = exampleDirectory + 'sdk/multiLingualVoice/';
  es.merge(
    gulp.src(mlmvDirectory + 'index.html', { base: mlmvDirectory })
      .pipe(replace('src="../../../dist/sdk/mindmeld.js"', 'src="js/vendor/mindmeld.js"')),
    gulp.src(mlmvDirectory + '*/**', { base: mlmvDirectory }),
    gulp.src(distMMDirectory + 'mindmeld.js', { base: distMMDirectory }).
      pipe(rename('./js/vendor/mindmeld.js'))
  )
    .pipe(zip('multilingual-mindmeld-voice.zip'))
    .pipe(gulp.dest(distMMDirectory + 'examples/'));
});


gulp.task('examples.nodeAuth', function () {
  gulp.src(exampleDirectory + 'server/NodeMMAuth/**')
    .pipe(zip('node-mm-auth.zip'))
    .pipe(gulp.dest(distMMDirectory + 'examples/'));
});

gulp.task('examples.build', ['examples.multilingual-voice', 'examples.nodeAuth']);
