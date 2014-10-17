/* jshint node: true, browser: false */

var gulp = require('gulp');
var taskListing = require('gulp-task-listing');
var connect = require('gulp-connect');
var shell = require('gulp-shell');


// -------------------------- Mindmeld.js Tasks -------------------------- //
require('./gulp/tasks/sdk');

gulp.task('buildSDK', ['sdk']);
gulp.task('archiveSDK', ['archive']);
gulp.task('uglifyMM', ['sdk.uglify']);

// ----------------------------------------------------------------------- //


// ------------------------ Search Widget Tasks ------------------------ //
require('./gulp/tasks/searchWidget');

gulp.task('buildSearchWidget', [ 'sw.build']);

// --------------------------------------------------------------------- //


// -------------------------- Voice Navigator -------------------------- //
require('./gulp/tasks/voiceNavigator');

gulp.task('buildVoiceNavigator', ['vn.build']);

// --------------------------------------------------------------------- //

// -------------------------- Microphone Widget -------------------------- //
require('./gulp/tasks/microphone');

gulp.task('buildMicrophone', ['mic.build']);

// --------------------------------------------------------------------- //

// -------------------------- Search Input Widget -------------------------- //
require('./gulp/tasks/searchInput');

gulp.task('buildSearchInput', ['searchInput.build']);

// --------------------------------------------------------------------- //


// -------------------------- Cards Widget -------------------------- //
require('./gulp/tasks/cardsWidget');

gulp.task('buildCards', ['cards.build']);

// --------------------------------------------------------------------- //

// -------------------------- Build Examples -------------------------- //
require('./gulp/tasks/examples');

gulp.task('buildExamples', ['examples.build']);

// --------------------------------------------------------------------- //


// ------------------------------ Tests -------------------------------- //
require('./gulp/tasks/tests');

// --------------------------------------------------------------------- //


// General Tasks
gulp.task('archive', ['sdk.archive', 'docs', 'build']);
gulp.task('build', [
  'sdk.build',
  'sw.build',
  'vn.build',
  'mic.build',
  'cards.build',
  'searchInput.build',
  'examples.build',
  'tests.build']);

gulp.task('docs', function () {
  // We do it this slightly hacky way, because you need to jsdoc all the files at once,
  // otherwise index.html keeps getting overwritten.
  var docPaths = [
      'src/sdk/main.js',
      'src/sdk/listener.js',
      'README.md',
      'src/widgets/voiceNavigator/js/widget.js'
  ];
  var jsdocCmd = './node_modules/.bin/jsdoc --destination dist/docs/' +
    ' --template src/docsTemplate/jaguarjs-doc/' +
    ' --configure src/docsTemplate/jaguar.conf.json' +
    ' ' + docPaths.join(' ');

  gulp.src('README.md')
    .pipe(gulp.dest('dist/'));
  return gulp.src('')
    .pipe(shell(jsdocCmd));
});

gulp.task('default', ['build', 'docs']);

gulp.task('serve.no-build', function() {
    connect.server({
        root: __dirname,
        https: true,
        livereload: false
    });
});

// serve the repo to view examples
gulp.task('serve', function() {
    connect.server({
        https: true,
        livereload: false
    });
});

gulp.task('serve.livereload', function() {
    connect.server({
        https: true,
        livereload: true
    });
});

// Task to show list of tasks
gulp.task('tasks', taskListing.withFilters(/\./));
