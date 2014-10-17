/* jshint node: true, browser: false */

var gulp = require('gulp');
var shell = require('gulp-shell');
var taskListing  = require('gulp-task-listing');

var rootDirectory = __dirname + '/../../';
var distDirectory = rootDirectory + 'dist/';
var srcDirectory = rootDirectory + 'src/';
var distTestDirectory = distDirectory + 'test/';
var srcTestDirectory = srcDirectory + 'test/';
var srcBowerDirectory = rootDirectory + 'bower_components/';
var distBowerDirectory = distTestDirectory + 'bower_components/';

var paths = {
  spec: srcTestDirectory + 'spec/*.js',
  data: srcTestDirectory + 'spec/data/*.js',
  specRunner: srcTestDirectory + '*.html',
  bower: srcBowerDirectory + '**'
};

gulp.task('tests.html', function () {
  return gulp.src(paths.specRunner)
    .pipe(gulp.dest(distTestDirectory));
});

gulp.task('tests.bower', function () {
  return gulp.src(paths.bower)
    .pipe(gulp.dest(distBowerDirectory));
});

gulp.task('tests.spec', function () {
  gulp.src(paths.spec)
    .pipe(gulp.dest(distTestDirectory + 'spec/'));
  gulp.src(srcTestDirectory + '/run-jasmine2.js')
    .pipe(gulp.dest(distTestDirectory));
});

gulp.task('tests.data', function () {
  return gulp.src(paths.data)
    .pipe(gulp.dest(distTestDirectory + 'spec/data'));
});

gulp.task('tests.build', ['tests.html', 'tests.spec', 'tests.data', 'tests.bower']);

gulp.task('tests.watch', ['tests.build'], function () {
  gulp.watch(paths.specRunner, ['tests.html']);
  gulp.watch(paths.spec, ['tests.spec']);
  gulp.watch(paths.data, ['tests.data']);
});

gulp.task('tests.unit', ['tests.build'], function () {
  var testCmd = 'phantomjs ' + distTestDirectory + 'run-jasmine2.js ' +
    distTestDirectory + 'UnitTestRunner.html';
  //throw new Error('not yet implemented');
  return gulp.src('')
    .pipe(shell(testCmd));
});

gulp.task('tests.integration', ['tests.build'], function () {
  var testCmd = 'phantomjs ' + distTestDirectory + 'run-jasmine2.js ' +
    distTestDirectory + 'IntegrationTestRunner.html';
  //throw new Error('not yet implemented');
  return gulp.src('')
    .pipe(shell(testCmd));
});

gulp.task('tests', ['tests.unit', 'tests.integration']);
gulp.task('tests.tasks', taskListing.withFilters(/\./, /^(?!tests).+/));
