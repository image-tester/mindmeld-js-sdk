/* jshint node: true, browser: false */

// gulpfile to build the MindMeldMicrophone source files

'use strict';

// gulp plugins
var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

// Paths
var rootDirectory = __dirname + '/../../';
var distDirectory = rootDirectory + 'dist/widgets/cards/';
var srcDirectory = rootDirectory + 'src/widgets/cards/';

var paths = {
  js: [
    srcDirectory + '**/*.js'
  ],
  styles: [
    srcDirectory + '**/*.scss'
  ],
  html: [
    srcDirectory + '**/*.html'
  ],
  images: [
    srcDirectory + 'images/**'
  ]
};

// Compile and minify SCSS
gulp.task('cards.css', function () {
  return gulp.src(paths.styles)
    .pipe(sass())
    .pipe(gulp.dest(distDirectory))
    .pipe(minifyCSS())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(distDirectory));
});

// Concat and minify JS
gulp.task('cards.js', function () {
  return gulp.src(paths.js)
    .pipe(sourcemaps.init())
      // .pipe(concat(paths.js))
      .pipe(gulp.dest(distDirectory))
      .pipe(uglify(), {
        mangle: true
      })
      .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(distDirectory));
});

// Copy HTML
gulp.task('cards.html', function () {
  return gulp.src(paths.html)
    .pipe(gulp.dest(distDirectory));
});

gulp.task('cards.images', function () {
  return gulp.src(paths.images)
    .pipe(gulp.dest(distDirectory + 'images/'));
});


// Main gulp task used to completely build the
// Cards files
gulp.task('cards.build', ['cards.js', 'cards.css', 'cards.html', 'cards.images']);

// Watch for changes in source files and automatically build
gulp.task('cards.watch', ['cards.build'], function () {
    gulp.watch([paths.js], ['cards.js']);
    gulp.watch([paths.styles], ['cards.css']);
    gulp.watch([paths.html], ['cards.html']);
    gulp.watch([paths.images], ['cards.images']);
});
